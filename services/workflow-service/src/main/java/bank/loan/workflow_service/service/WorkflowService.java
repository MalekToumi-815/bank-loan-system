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
import bank.loan.workflow_service.dto.StartProcessRequest;
import bank.loan.workflow_service.model.Role;

@Service
public class WorkflowService {
    private final RuntimeService runtimeService;
    private final TaskService taskService;
    private final RestClient restClient;
    private final String internalSecret;

    public WorkflowService(RuntimeService runtimeService, TaskService taskService, RestClient.Builder restClientBuilder, @Value("${internal.shared-secret}") String internalSecret) {
        this.runtimeService = runtimeService;
        this.taskService = taskService;
        this.restClient = restClientBuilder
                .baseUrl("http://account-service") 
                .build();
        this.internalSecret = internalSecret;
    }

    public ResponseEntity<Map<String, String>> startWorkflow(StartProcessRequest request) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("loanId", request.loanId());
        variables.put("clientId", request.clientId());

        ProcessInstance processInstance = runtimeService.startProcessInstanceByKey("creditWorkflow", variables);
        
        Map<String, String> response = new HashMap<>();
        response.put("processInstanceId", processInstance.getId());
        return ResponseEntity.ok(response);
    }

    public ResponseEntity<List<TaskResponseDto>> getTasks(String assignee) {
        List<Task> tasks = taskService.createTaskQuery()
                .taskAssignee(assignee)
                .active()
                .list();

        List<TaskResponseDto> response = tasks.stream().map(task -> {
            // Fetch the loanId bound to this specific process execution instance
            String loanId = (String) runtimeService.getVariable(task.getExecutionId(), "loanId");

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
        taskService.complete(taskId, variables);
        return ResponseEntity.noContent().build();
    }

    //Fetching Active Users with a certain Role
    public List<UserResponse> fetchUsers(Role role) {
        return restClient.get()
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
