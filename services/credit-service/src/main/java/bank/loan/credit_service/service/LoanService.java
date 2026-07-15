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
    public Loan createLoan(Loan loan) {
        return loanRepository.save(loan);
    }

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

    public Loan linkWorkflowInstance(Long id, String processInstanceId) {
        return loanRepository.findById(id)
                .map(loan -> {
                    loan.setWorkflowProcessInstanceId(processInstanceId);
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

    // Methods for controller to call
    public ResponseEntity<Map<String, String>> createLoanResponse(LoanRequest loanrequest, Long clientId) {
        try {
            if (!isUserEligibleForLoan(clientId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("status", "FAILED", "message", "User is not eligible for a loan"));
            }
            Loan loan = new Loan(
                    loanrequest.submissionDate(),
                    loanrequest.amount(),
                    loanrequest.type(),
                    loanrequest.durationMonths(),
                    loanrequest.interestRate());
            loan.setClientId(clientId);
            createLoan(loan);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("status", "SUCCESS", "message", "Loan created"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("status", "FAILED", "message", ex.getMessage()));
        }
    }

    public ResponseEntity<LoanRequest> getLoanByIdResponse(Long id) {
        Loan loan = getLoanById(id);
        if (loan == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(toLoanRequest(loan));
    }

    public ResponseEntity<List<LoanRequest>> getAllLoansResponse() {
        List<LoanRequest> loans = getAllLoans().stream()
                .map(this::toLoanRequest)
                .toList();
        return ResponseEntity.ok(loans);
    }

    private LoanRequest toLoanRequest(Loan loan) {
        return new LoanRequest(
                loan.getSubmissionDate(),
                loan.getAmount(),
                loan.getType(),
                loan.getDurationMonths(),
                loan.getInterestRate());
    }

    public ResponseEntity<Map<String, String>> updateLoanStatusResponse(Long id, LoanStatus status) {
        Loan loan = updateLoanStatus(id, status);
        if (loan == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("status", "FAILED", "message", "Loan not found"));
        }
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Loan status updated"));
    }

    public ResponseEntity<Map<String, String>> linkWorkflowInstanceResponse(Long id, String processInstanceId) {
        Loan loan = linkWorkflowInstance(id, processInstanceId);
        if (loan == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("status", "FAILED", "message", "Loan not found"));
        }
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Workflow instance linked"));
    }
}
