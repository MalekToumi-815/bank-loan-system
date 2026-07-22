package bank.loan.workflow_service.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.flowable.engine.RuntimeService;
import org.springframework.beans.factory.annotation.Value;
import org.flowable.engine.TaskService;
import org.flowable.engine.runtime.ProcessInstance;
import org.flowable.task.api.Task;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.ResponseEntity;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import bank.loan.workflow_service.dto.TaskResponseDto;
import bank.loan.workflow_service.dto.AdminTask;
import bank.loan.workflow_service.dto.LoanRequest;
import bank.loan.workflow_service.dto.ReceptionistTask;
import bank.loan.workflow_service.model.LoanStatus;
import bank.loan.workflow_service.model.Role;
import bank.loan.workflow_service.model.TaskKeys;

@Service
public class WorkflowService {
    private final RuntimeService runtimeService;
    private final TaskService taskService;
    private final RestClient accountClient;
    private final RestClient creditClient;
    private final String internalSecret;

    public WorkflowService(RuntimeService runtimeService, TaskService taskService, RestClient.Builder restClientBuilder, @Value("${internal.shared-secret}") String internalSecret) {
        this.runtimeService = runtimeService;
        this.taskService = taskService;
        this.accountClient = restClientBuilder
                .baseUrl("http://account-service")
                .build();
        this.creditClient = restClientBuilder
                .baseUrl("http://credit-service")
                .build();
        this.internalSecret = internalSecret;
    }

    public ResponseEntity<Map<String, Object>> startWorkflow(LoanRequest request, Long clientId) {
        Long loanId = null; 
        String processInstanceId = null;

        try {
            // --- STEP A: Ask credit-service to create the loan ---
            Map<String, Object> createResponse = creditClient.post()
                    .uri("/loans")
                    .header("X-User-Id", clientId.toString())
                    .header("X-Internal-Secret", internalSecret)
                    .body(request)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});

            if (createResponse == null || !createResponse.containsKey("loanId")) {
                throw new RuntimeException("Failed to create loan in credit-service");
            }

            loanId = Long.valueOf(createResponse.get("loanId").toString());

            // --- STEP B: Start the Flowable Process Instance ---
            Map<String, Object> variables = new HashMap<>();
            variables.put("loanId", loanId);
            variables.put("clientId", clientId);

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
                task.getProcessInstanceId(),
                loanId
            );
        }).toList();

        return ResponseEntity.ok(response);
    }

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
            case officer_validation -> setBooleanProcessVariable(task, taskVariables, "is_valid");
            case admin_approval -> completeAdminApprovalTask(loanId, task, taskVariables);
            case admin_decision -> completeAdminDecisionTask(loanId, task, taskVariables);
            case officer_recommendation -> {//TODO: Implement officer recommendation task completion logic
            }
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

    private void setBooleanProcessVariable(Task task, Map<String, Object> variables, String variableName) {
        Object value = variables.get(variableName);
        if (!(value instanceof Boolean)) {
            value = Boolean.parseBoolean(String.valueOf(value));
        }
        variables.put(variableName, value);
    }

    private void completeAdminApprovalTask(Long loanId, Task task, Map<String, Object> variables) {
        setBooleanProcessVariable(task, variables, "is_approved");
        boolean approved = (Boolean) variables.get("is_approved");

        creditClient.put()
                .uri("/loans/{id}/status", loanId)
                .header("X-Internal-Secret", internalSecret)
                .body(Map.of("status", approved ? LoanStatus.APPROVED.name() : LoanStatus.REJECTED.name()))
                .retrieve()
                .toBodilessEntity();
    }

    private void completeAdminDecisionTask(Long loanId, Task task, Map<String, Object> variables) {
        float amount = getFloatVariable(variables, "amount");
        int durationMonths = getIntVariable(variables, "durationMonths");
        String finalDecision = String.valueOf(variables.get("finalDecision"));

        variables.put("amount", amount);
        variables.put("durationMonths", durationMonths);

        creditClient.put()
                .uri("/loans/{id}/admin-task", loanId)
                .header("X-Internal-Secret", internalSecret)
                .body(new AdminTask(amount, finalDecision, durationMonths))
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

    //Fetching Active Users with a certain Role
    public List<UserResponse> fetchUsers(Role role) {
        return accountClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/users")
                        .queryParam("role", role)
                        .queryParam("status", "ACTIVE")
                        .build())
                .headers(headers -> headers.set("X-Internal-Secret", internalSecret))
                .retrieve()
                .body(new ParameterizedTypeReference<List<UserResponse>>() {});
    }

    // Shared DTO record
    public record UserResponse(Long id, String name, String email) {}
}
