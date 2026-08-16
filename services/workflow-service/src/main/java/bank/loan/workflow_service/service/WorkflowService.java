package bank.loan.workflow_service.service;

import java.util.Date;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;

import org.flowable.engine.HistoryService;
import org.flowable.engine.RuntimeService;
import org.springframework.beans.factory.annotation.Value;
import org.flowable.engine.TaskService;
import org.flowable.engine.history.HistoricProcessInstance;
import org.flowable.engine.runtime.ProcessInstance;
import org.flowable.task.api.Task;
import org.flowable.variable.api.history.HistoricVariableInstance;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.ResponseEntity;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import bank.loan.workflow_service.dto.TaskResponseDto;
import bank.loan.workflow_service.dto.AdminTask;
import bank.loan.workflow_service.dto.HistoricProcessInstanceDto;
import bank.loan.workflow_service.dto.LoanRequest;
import bank.loan.workflow_service.dto.ProcessInstanceDto;
import bank.loan.workflow_service.dto.ReceptionistTask;
import bank.loan.workflow_service.dto.PageResponse;
import bank.loan.workflow_service.model.LoanStatus;
import bank.loan.workflow_service.model.LoanType;
import bank.loan.workflow_service.model.Role;
import bank.loan.workflow_service.model.TaskKeys;

@Service
public class WorkflowService {
    private final RuntimeService runtimeService;
    private final TaskService taskService;
    private final HistoryService historyService;
    private final RestClient accountClient;
    private final RestClient creditClient;
    private final String internalSecret;

    public WorkflowService(RuntimeService runtimeService, TaskService taskService, HistoryService historyService, RestClient.Builder restClientBuilder, @Value("${internal.shared-secret}") String internalSecret) {
        this.runtimeService = runtimeService;
        this.taskService = taskService;
        this.historyService = historyService;
        this.accountClient = restClientBuilder
                .baseUrl("http://account-service")
                .build();
        this.creditClient = restClientBuilder
                .baseUrl("http://credit-service")
                .build();
        this.internalSecret = internalSecret;
    }

    //Start Workflow and handle rollback in case of failure
    public ResponseEntity<Map<String, Object>> startWorkflow(LoanRequest request, Long clientId) {
        Long loanId = null; 
        String processInstanceId = null;
        String type;

        try {
            // --- STEP A: Ask credit-service to create the loan ---
            Map<String, Object> createResponse = creditClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/loans")
                            .queryParam("clientId", clientId.toString())
                            .build())
                    .header("X-Internal-Secret", internalSecret)
                    .body(request)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});

            if (createResponse == null || !createResponse.containsKey("loanId")) {
                throw new RuntimeException("Failed to create loan in credit-service");
            }

            loanId = Long.valueOf(createResponse.get("loanId").toString());
            type = request.type().name();

            // --- STEP B: Start the Flowable Process Instance ---
            Map<String, Object> variables = new HashMap<>();
            variables.put("loanId", loanId);
            variables.put("clientId", clientId);
            variables.put("loanType", type);

            ProcessInstance processInstance = runtimeService.startProcessInstanceByKey("creditWorkflow", variables);
            processInstanceId = processInstance.getId();

            // --- STEP C: Send the processInstanceId back to credit-service ---
            creditClient.put()
                    .uri("/loans/{id}/process-instance-id", loanId)
                    .header("X-Internal-Secret", internalSecret)
                    .body(Map.of("processInstanceId", processInstanceId))
                    .retrieve()
                    .toBodilessEntity();

            // Return final success response
            Map<String, Object> response = new HashMap<>();
            response.put("processInstanceId", processInstanceId);
            response.put("loanId", loanId);
            response.put("status", "SUCCESS");

            return ResponseEntity.ok(response);

        } catch (Exception ex) {
            // --- THE ROLLBACK (Compensating Transaction) ---

            if (loanId != null) {
                try {
                    // If the loan was created, but the process failed, DELETE the orphaned loan
                    creditClient.delete() 
                            .uri("/loans/{id}", loanId)
                            .header("X-Internal-Secret", internalSecret)
                            .retrieve()
                            .toBodilessEntity();
                } catch (Exception rollbackEx) {
                    // If the rollback ALSO fails, log this heavily so developers can fix it manually
                    System.err.println("CRITICAL ALERT: Failed to rollback orphaned loan ID: " + loanId);
                }
            }

            if (processInstanceId != null) {
                try {
                    // If Flowable started but Step C failed, delete the orphaned workflow
                    runtimeService.deleteProcessInstance(processInstanceId, "Failed to update credit-service");
                } catch (Exception rollbackEx) {
                    System.err.println("CRITICAL ALERT: Failed to rollback orphaned process ID: " + processInstanceId);
                }
            }

            // Re-throw the error so the user knows it failed
            throw new RuntimeException("Workflow initiation failed. The transaction was rolled back.", ex);
        }
    }


    // Fetch tasks assigned to a specific user
    public ResponseEntity<List<TaskResponseDto>> getTasks(String assignee) {
        List<Task> tasks = taskService.createTaskQuery()
                .taskAssignee(assignee)
                .active()
                .list();

        List<TaskResponseDto> response = tasks.stream().map(task -> {
            // Fetch the loanId bound to this specific process execution instance
            Long loanId = (Long) runtimeService.getVariable(task.getExecutionId(), "loanId");

            // Map directly to your strongly-typed DTO record
            return new TaskResponseDto(
                task.getId(),
                task.getName(),
                task.getTaskDefinitionKey(),
                task.getAssignee(),
                task.getProcessInstanceId(),
                loanId
            );
        }).toList();

        return ResponseEntity.ok(response);
    }


    // Complete a task and handle specific logic based on the task type
    public ResponseEntity<Void> completeTask(String taskId, Map<String, Object> variables) {
        Task task = taskService.createTaskQuery()
                .taskId(taskId)
                .singleResult();

        if (task == null) {
            throw new IllegalArgumentException("Task not found: " + taskId);
        }

        Long loanId = (Long) runtimeService.getVariable(task.getExecutionId(), "loanId");
        Map<String, Object> taskVariables = variables == null
                ? new HashMap<>()
                : new HashMap<>(variables);

        switch (TaskKeys.valueOf(task.getTaskDefinitionKey())) {
            case receptionist_create_loan -> completeReceptionistTask(loanId, taskVariables);
            case officer_validation -> completeOfficerValidationTask(loanId, task, taskVariables);
            case admin_approval -> completeAdminApprovalTask(loanId, task, taskVariables);
            case admin_decision -> completeAdminDecisionTask(loanId, task, taskVariables);
            case officer_recommendation -> completeOfficerRecommendationTask(loanId, taskVariables);
        }

        runtimeService.setVariables(task.getProcessInstanceId(), taskVariables);
        taskService.complete(taskId, taskVariables);
        return ResponseEntity.noContent().build();
    }

    private void completeReceptionistTask(Long loanId, Map<String, Object> variables) {
        float interestRate = getFloatVariable(variables, "interestRate");

        creditClient.put()
                .uri("/loans/{id}/receptionist-task", loanId)
                .header("X-Internal-Secret", internalSecret)
                .body(new ReceptionistTask(interestRate, LoanStatus.UNDER_REVIEW))
                .retrieve()
                .toBodilessEntity();
    }

    private void completeOfficerRecommendationTask(Long loanId, Map<String, Object> variables) {
        String riskScore = String.valueOf(variables.get("riskScore"));
        String recommendation = String.valueOf(variables.get("recommendation"));

        if (riskScore == null || riskScore.isBlank()) {
            throw new IllegalArgumentException("riskScore is required for officer recommendation task");
        }

        if (recommendation == null || recommendation.isBlank()) {
            throw new IllegalArgumentException("recommendation is required for officer recommendation task");
        }

        creditClient.post()
                .uri("/loans/{id}/risk", loanId)
                .header("X-Internal-Secret", internalSecret)
                .body(Map.of(
                        "riskScore", riskScore,
                        "recommendation", recommendation))
                .retrieve()
                .toBodilessEntity();
    }

    private void setBooleanProcessVariable(Task task, Map<String, Object> variables, String variableName) {
        Object value = variables.get(variableName);
        if (!(value instanceof Boolean)) {
            value = Boolean.parseBoolean(String.valueOf(value));
        }
        variables.put(variableName, value);
    }

    private void completeOfficerValidationTask(Long loanId, Task task, Map<String, Object> variables) {
        setBooleanProcessVariable(task, variables, "is_valid");
        handleRejectionReasonIfNeeded(loanId, variables, "is_valid", "rejectionReason", Role.LOAN_OFFICER);
    }

    private void completeAdminApprovalTask(Long loanId, Task task, Map<String, Object> variables) {
        setBooleanProcessVariable(task, variables, "is_approved");
        boolean approved = (Boolean) variables.get("is_approved");

        if (!approved) {
            String rejectionReason = getRequiredStringVariable(variables, "rejectionReason");
            updateRejectionReason(loanId, rejectionReason, Role.BANK_ADMIN);
        }

        creditClient.put()
                .uri("/loans/{id}/status", loanId)
                .header("X-Internal-Secret", internalSecret)
                .body(Map.of("status", approved ? LoanStatus.APPROVED.name() : LoanStatus.REJECTED.name()))
                .retrieve()
                .toBodilessEntity();
    }

    private void handleRejectionReasonIfNeeded(Long loanId, Map<String, Object> variables, String booleanVariableName, String reasonVariableName, Role role) {
        Object value = variables.get(booleanVariableName);
        boolean accepted = value instanceof Boolean booleanValue ? booleanValue : Boolean.parseBoolean(String.valueOf(value));

        if (!accepted) {
            String rejectionReason = getRequiredStringVariable(variables, reasonVariableName);
            updateRejectionReason(loanId, rejectionReason, role);
        }
    }

    private String getRequiredStringVariable(Map<String, Object> variables, String variableName) {
        Object value = variables.get(variableName);
        if (value == null) {
            throw new IllegalArgumentException(variableName + " is required when the decision is false");
        }

        String text = String.valueOf(value).trim();
        if (text.isBlank()) {
            throw new IllegalArgumentException(variableName + " is required when the decision is false");
        }

        return text;
    }

    private void completeAdminDecisionTask(Long loanId, Task task, Map<String, Object> variables) {
        float amount = getFloatVariable(variables, "amount");
        int durationMonths = getIntVariable(variables, "durationMonths");
        String finalDecision = String.valueOf(variables.get("finalDecision"));
        Date startDate = getDateVariable(variables, "startDate");

        variables.put("amount", amount);
        variables.put("durationMonths", durationMonths);
        variables.put("startDate", startDate);

        creditClient.put()
                .uri("/loans/{id}/admin-task", loanId)
                .header("X-Internal-Secret", internalSecret)
                .body(new AdminTask(amount, finalDecision, durationMonths, startDate))
                .retrieve()
                .toBodilessEntity();
    }

    private float getFloatVariable(Map<String, Object> variables, String variableName) {
        Object value = variables.get(variableName);
        if (value instanceof Number number) {
            return number.floatValue();
        }
        return Float.parseFloat(String.valueOf(value));
    }

    private int getIntVariable(Map<String, Object> variables, String variableName) {
        Object value = variables.get(variableName);
        if (value instanceof Number number) {
            return number.intValue();
        }
        return Integer.parseInt(String.valueOf(value));
    }

    private Date getDateVariable(Map<String, Object> variables, String variableName) {
        Object value = variables.get(variableName);

        if (value instanceof Date date) {
            return date;
        }

        if (value instanceof String text && !text.isBlank()) {
            try {
                return Date.from(LocalDate.parse(text).atStartOfDay(ZoneId.systemDefault()).toInstant());
            } catch (DateTimeParseException ex) {
                return Date.from(java.time.Instant.parse(text));
            }
        }

        throw new IllegalArgumentException(variableName + " is required");
    }

    public List<UserResponse> fetchUsers(Role role) {
        PageResponse<UserResponse> pageResponse = accountClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/users")
                        .queryParam("role", role)
                        .queryParam("status", "ACTIVE")
                        .queryParam("size", 1000) // Ensure enough users are returned per page
                        .build())
                .headers(headers -> headers.set("X-Internal-Secret", internalSecret))
                .retrieve()
                .body(new ParameterizedTypeReference<PageResponse<UserResponse>>() {});

        return (pageResponse != null && pageResponse.content() != null) 
                ? pageResponse.content() 
                : Collections.emptyList();
    }

    // Fetch a single user by ID
    public UserResponse fetchUser(Long userId) {
        return accountClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/users/" + userId)
                        .build())
                .headers(headers -> headers.set("X-Internal-Secret", internalSecret))
                .retrieve()
                .body(new ParameterizedTypeReference<UserResponse>() {});
    }

    // Shared DTO record
    public record UserResponse(Long id, String name, String email, String role, String surname) {}

    //Admin monitoring methods
    // Fetch tasks by task definition key (optional)
    public ResponseEntity<List<TaskResponseDto>> getTasksByKey(String taskKey) {
        var query = taskService.createTaskQuery().active();
        
        if (taskKey != null && !taskKey.isBlank()) {
            query.taskDefinitionKey(taskKey);
        }

        List<Task> tasks = query.list();

        List<TaskResponseDto> response = tasks.stream().map(task -> {
            Long loanId = (Long) runtimeService.getVariable(task.getExecutionId(), "loanId");
            return new TaskResponseDto(
                task.getId(),
                task.getName(),
                task.getTaskDefinitionKey(),
                task.getAssignee(),
                task.getProcessInstanceId(),
                loanId
            );
        }).toList();

        return ResponseEntity.ok(response);
    }

    // Fetch active process instances
    public ResponseEntity<List<ProcessInstanceDto>> getActiveInstances() {
    List<ProcessInstance> instances = runtimeService.createProcessInstanceQuery()
            .active()
            .list();

    List<ProcessInstanceDto> response = instances.stream().map(inst -> {
        // 1. Fetch active user tasks for this process instance
        List<Task> activeTasks = taskService.createTaskQuery()
                .processInstanceId(inst.getId())
                .active()
                .list();

        // 2. Extract task names (handles parallel tasks or fallback for system tasks)
        String currentTaskName = activeTasks.isEmpty() 
                ? "System Processing" // Shown when execution is at a Java Delegate / Service Task
                : activeTasks.stream()
                        .map(Task::getName)
                        .collect(Collectors.joining(", "));

        // 3. Safely extract loanId variable
        Object rawLoanId = runtimeService.getVariable(inst.getId(), "loan_id");
        if (rawLoanId == null) {
            rawLoanId = runtimeService.getVariable(inst.getId(), "loanId");
        }
        Long loanId = (rawLoanId instanceof Number n) ? n.longValue() : null;

        return new ProcessInstanceDto(
                inst.getId(),
                inst.getProcessDefinitionKey(),
                inst.getStartTime(),
                loanId,
                currentTaskName 
        );
    }).toList();

    return ResponseEntity.ok(response);
}

public ResponseEntity<ProcessInstanceDto> getProcessInstanceById(String processInstanceId) {
    ProcessInstance instance = runtimeService.createProcessInstanceQuery()
            .processInstanceId(processInstanceId)
            .active()
            .singleResult();

    if (instance == null) {
        return ResponseEntity.notFound().build();
    }

    List<Task> activeTasks = taskService.createTaskQuery()
            .processInstanceId(processInstanceId)
            .active()
            .list();

    String currentTaskName = activeTasks.isEmpty()
            ? "System Processing"
            : activeTasks.stream()
                    .map(Task::getName)
                    .collect(Collectors.joining(", "));

    Object rawLoanId = runtimeService.getVariable(processInstanceId, "loan_id");
    if (rawLoanId == null) {
        rawLoanId = runtimeService.getVariable(processInstanceId, "loanId");
    }
    Long loanId = (rawLoanId instanceof Number n) ? n.longValue() : null;

    ProcessInstanceDto dto = new ProcessInstanceDto(
            instance.getId(),
            instance.getProcessDefinitionKey(),
            instance.getStartTime(),
            loanId,
            currentTaskName
    );

    return ResponseEntity.ok(dto);
}

    // Fetch historic (inactive) process instances
    public ResponseEntity<List<HistoricProcessInstanceDto>> getInactiveInstances() {
        // Query process instances that have finished (completed or deleted)
        List<HistoricProcessInstance> historicInstances = historyService.createHistoricProcessInstanceQuery()
                .finished()
                .orderByProcessInstanceEndTime().desc()
                .list();

        List<HistoricProcessInstanceDto> response = historicInstances.stream().map(inst -> {
            // Retrieve the loanId from historic variables tied to this process
            Long loanId = null;
            HistoricVariableInstance var = historyService.createHistoricVariableInstanceQuery()
                    .processInstanceId(inst.getId())
                    .variableName("loanId")
                    .singleResult();

            if (var != null && var.getValue() != null) {
                loanId = (Long) var.getValue();
            }

            return new HistoricProcessInstanceDto(
                inst.getId(),
                inst.getProcessDefinitionKey(),
                inst.getStartTime(),
                inst.getEndTime(),
                loanId
            );
        }).toList();

        return ResponseEntity.ok(response);
    }

    //generate Amortization Schedule for a specific loan
    public ResponseEntity<Map<String, String>> generateAmortizationSchedule(Long loanId) {
        creditClient.post()
                .uri("/loans/{id}/ammortisation", loanId)
                .header("X-Internal-Secret", internalSecret)
                .retrieve()
                .toBodilessEntity();

        Map<String, String> response = new HashMap<>();
        response.put("message", "Amortization schedule generated successfully for loan ID: " + loanId);
        return ResponseEntity.ok(response);
    }

    //update loan employee assignments
    public ResponseEntity<Map<String, String>> updateLoanAssignments(Long loanId, Long employeeId, Role role) {
        creditClient.put()
                .uri("/loans/{id}/assign-user", loanId)
                .header("X-Internal-Secret", internalSecret)
                .body(Map.of("userId", employeeId, "role", role))
                .retrieve()
                .toBodilessEntity();

        Map<String, String> response = new HashMap<>();
        response.put("message", "Loan assignments updated successfully for loan ID: " + loanId);
        return ResponseEntity.ok(response);
    }

    //update rejection reasons for a specific loan
    public ResponseEntity<Map<String, String>> updateRejectionReason(Long loanId, String reason, Role role) {
        creditClient.put()
                .uri("/loans/{id}/rejection-reason", loanId)
                .header("X-Internal-Secret", internalSecret)
                .body(Map.of("reason", reason, "role", role))
                .retrieve()
                .toBodilessEntity();

        Map<String, String> response = new HashMap<>();
        response.put("message", "Rejection reason updated successfully for loan ID: " + loanId);
        return ResponseEntity.ok(response);
    }

    //internal methode to update workflow step for a specific loan
    public ResponseEntity<Map<String, String>> updateWorkflowStep(Long loanId, String workflowTask) {
        creditClient.put()
                .uri("/loans/update-workflowTask/{id}", loanId)
                .header("X-Internal-Secret", internalSecret)
                .body(Map.of("workflowTask", workflowTask))
                .retrieve()
                .toBodilessEntity();

        Map<String, String> response = new HashMap<>();
        response.put("message", "Workflow step updated successfully for loan ID: " + loanId);
        return ResponseEntity.ok(response);
    }
}
