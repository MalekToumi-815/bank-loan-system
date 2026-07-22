package bank.loan.workflow_service.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import bank.loan.workflow_service.dto.HistoricProcessInstanceDto;
import bank.loan.workflow_service.dto.LoanRequest;
import bank.loan.workflow_service.dto.ProcessInstanceDto;
import bank.loan.workflow_service.dto.TaskResponseDto;
import bank.loan.workflow_service.service.WorkflowService;

@RestController
@RequestMapping("/workflow")
public class WorkflowController {

    private final WorkflowService workflowService;

    public WorkflowController(WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @PostMapping("/start")
    public ResponseEntity<Map<String, Object>> startWorkflow(@RequestBody LoanRequest request,@RequestHeader("X-User-Id") Long clientId) {
        return workflowService.startWorkflow(request, clientId);
    }

    @GetMapping("/tasks")
    public ResponseEntity<List<TaskResponseDto>> getTasks(@RequestParam String assignee) {
        return workflowService.getTasks(assignee);
    }

    @PostMapping("/tasks/{taskId}/complete")
    public ResponseEntity<Void> completeTask(@PathVariable String taskId, @RequestBody Map<String, Object> variables) {
        return workflowService.completeTask(taskId, variables);
    }

    @GetMapping("/admin/instances/history")
    public ResponseEntity<List<HistoricProcessInstanceDto>> getInstancesHistory() {
        return workflowService.getInactiveInstances();
    }

    @GetMapping("/admin/instances/active")
    public ResponseEntity<List<ProcessInstanceDto>> getActiveInstances() {
        return workflowService.getActiveInstances();
    }

    @GetMapping("/admin/tasks")
    public ResponseEntity<List<TaskResponseDto>> getTasksByKey(@RequestParam(required = false) String taskKey) {
        return workflowService.getTasksByKey(taskKey);
    }
}
