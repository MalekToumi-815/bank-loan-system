package bank.loan.workflow_service.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import bank.loan.workflow_service.dto.StartProcessRequest;
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
    public ResponseEntity<Map<String, String>> startWorkflow(@Validated @RequestBody StartProcessRequest request) {
        return workflowService.startWorkflow(request);
    }

    @GetMapping("/tasks")
    public ResponseEntity<List<TaskResponseDto>> getTasks(@RequestParam String assignee) {
        return workflowService.getTasks(assignee);
    }

    @PostMapping("/tasks/{taskId}/complete")
    public ResponseEntity<Void> completeTask(@PathVariable String taskId, @RequestBody Map<String, Object> variables) {
        return workflowService.completeTask(taskId, variables);
    }
}
