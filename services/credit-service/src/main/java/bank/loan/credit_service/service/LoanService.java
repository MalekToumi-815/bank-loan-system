package bank.loan.credit_service.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import bank.loan.credit_service.dto.LoanRequest;
import bank.loan.credit_service.dto.LoanResponse;
import bank.loan.credit_service.model.Loan;
import bank.loan.credit_service.model.LoanStatus;
import bank.loan.credit_service.model.Role;
import bank.loan.credit_service.repository.LoanRepository;

@Service
public class LoanService {

    private final LoanRepository loanRepository;
    private final RestClient restClient;
    private final String internalSecret;

    public LoanService(LoanRepository loanRepository, RestClient.Builder restClientBuilder, @Value("${internal.shared-secret}") String internalSecret) {
        this.loanRepository = loanRepository;
        this.restClient = restClientBuilder.build();
        this.internalSecret = internalSecret;
    }

    // Basic CRUD operations for Loan entity
    public Loan getLoanById(Long id) {
        return loanRepository.findById(id).orElse(null);
    }

    public List<Loan> getAllLoans() {
        return loanRepository.findAll();
    }

    public Loan updateLoanStatus(Long id, LoanStatus status) {
        return loanRepository.findById(id)
                .map(loan -> {
                    loan.setStatus(status);
                    return loanRepository.save(loan);
                })
                .orElse(null);
    }

    // Method to check if a user is eligible for a loan based on their role
    public boolean isUserEligibleForLoan(Long userId) {
        try {
            AccountUserResponse user = restClient.get()
                    .uri("http://account-service/users/{id}", userId)
                    .header("X-Internal-Secret", internalSecret)
                    .retrieve()
                    .body(AccountUserResponse.class);

            return user != null && Role.CLIENT == user.role();
        } catch (RestClientException ex) {
            return false;
        }
    }

    private record AccountUserResponse(Long id, Role role) {
    }
    // Method to start the workflow process for a loan application
    public String startLoanWorkflow(Long loanId, Long clientId) {
        try {
            WorkflowStartRequest requestBody = new WorkflowStartRequest(loanId, clientId);

            WorkflowStartResponse response = restClient.post()
                    .uri("http://workflow-service/workflow/start")
                    .header("X-Internal-Secret", internalSecret)
                    .body(requestBody)
                    .retrieve()
                    .body(WorkflowStartResponse.class);
            if (response == null) {
                throw new IllegalStateException("Workflow service returned an empty response");
            }
            return response.processInstanceId();
        } catch (RestClientException ex) {
            throw new RuntimeException("Failed to start loan workflow process", ex);
        }
    }
    public record WorkflowStartResponse(String processInstanceId) {}
    public record WorkflowStartRequest(Long loanId, Long clientId) {}

    // Methods for controller to call
    public ResponseEntity<Map<String, String>> createLoanResponse(LoanRequest loanrequest, Long clientId) {
        try {
            if (!isUserEligibleForLoan(clientId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("status", "FAILED", "message", "User is not eligible for a loan"));
            }
            Loan loan = new Loan(
                    loanrequest.amount(),
                    loanrequest.type(),
                    loanrequest.durationMonths(),
                    loanrequest.interestRate());
            loan.setClientId(clientId);
            loanRepository.save(loan);
            String processInstanceId = startLoanWorkflow(loan.getId(), clientId);
            loan.setWorkflowProcessInstanceId(processInstanceId);
            loanRepository.save(loan);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("status", "SUCCESS", "message", "Loan submitted"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("status", "FAILED", "message", ex.getMessage()));
        }
    }

    public ResponseEntity<LoanResponse> getLoanByIdResponse(Long id) {
        Loan loan = getLoanById(id);
        if (loan == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(toLoanResponse(loan));
    }

    public ResponseEntity<List<LoanResponse>> getAllLoansResponse() {
        List<LoanResponse> loans = getAllLoans().stream()
                .map(this::toLoanResponse)
                .toList();
        return ResponseEntity.ok(loans);
    }
    
    private LoanResponse toLoanResponse(Loan loan) {
        return new LoanResponse(
                loan.getId(),
                loan.getSubmissionDate(),
                loan.getAmount(),
                loan.getType(),
                loan.getDurationMonths(),
                loan.getInterestRate(),
                loan.getWorkflowProcessInstanceId(),
                loan.getStatus());
    }

    public ResponseEntity<Map<String, String>> updateLoanStatusResponse(Long id, LoanStatus status) {
        Loan loan = updateLoanStatus(id, status);
        if (loan == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("status", "FAILED", "message", "Loan not found"));
        }
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Loan status updated"));
    }
}
