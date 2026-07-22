package bank.loan.credit_service.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import bank.loan.credit_service.dto.loan.LoanRequest;
import bank.loan.credit_service.dto.loan.LoanResponse;
import bank.loan.credit_service.dto.task.AdminTask;
import bank.loan.credit_service.dto.task.ReceptionistTask;
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

        public Loan updateProcessInstanceid(Long id, String processInstanceId) {
        return loanRepository.findById(id)
                .map(loan -> {
                    loan.setWorkflowProcessInstanceId(processInstanceId);
                    return loanRepository.save(loan);
                })
                .orElse(null);
    }

        public Loan updateReceptionistTask(Long id, ReceptionistTask task) {
            return loanRepository.findById(id)
                    .map(loan -> {
                        loan.setInterestRate(task.interestRate());
                        loan.setStatus(task.status());
                        return loanRepository.save(loan);
                    })
                    .orElse(null);
        }

        public Loan updateAdminTask(Long id, AdminTask task) {
            return loanRepository.findById(id)
                    .map(loan -> {
                        loan.setAmount(task.amount());
                        loan.setFinalDecision(task.finalDecision());
                        loan.setDurationMonths(task.durationMonths());
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
    public ResponseEntity<Map<String, Object>> createLoanResponse(LoanRequest loanrequest, Long clientId) {
        try {
            if (!isUserEligibleForLoan(clientId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("status", "FAILED", "message", "User is not eligible for a loan"));
            }
            Loan loan = new Loan(
                    loanrequest.amount(),
                    loanrequest.type(),
                    loanrequest.durationMonths());
            loan.setClientId(clientId);
            loanRepository.save(loan);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("status", "SUCCESS", "message", "Loan submitted", "loanId", loan.getId()));
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

    public ResponseEntity<Map<String, String>> deleteLoanResponse(Long id) {
        if (!loanRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("status", "FAILED", "message", "Loan not found"));
        }

        loanRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Loan deleted"));
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
                loan.getStatus(),
                loan.getFinalDecision());
    }

    public ResponseEntity<Map<String, String>> updateLoanStatusResponse(Long id, LoanStatus status) {
        Loan loan = updateLoanStatus(id, status);
        if (loan == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("status", "FAILED", "message", "Loan not found"));
        }
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Loan status updated"));
    }

        public ResponseEntity<Map<String, String>> updateProcessInstanceidResponse(Long id, String processInstanceId) {
        Loan loan = updateProcessInstanceid(id, processInstanceId);
        if (loan == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("status", "FAILED", "message", "Loan not found"));
        }
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Loan process instance ID updated"));
    }

        public ResponseEntity<Map<String, String>> updateReceptionistTaskResponse(Long id, ReceptionistTask task) {
            Loan loan = updateReceptionistTask(id, task);
            if (loan == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("status", "FAILED", "message", "Loan not found"));
            }
            return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Loan receptionist fields updated"));
        }

        public ResponseEntity<Map<String, String>> updateAdminTaskResponse(Long id, AdminTask task) {
            Loan loan = updateAdminTask(id, task);
            if (loan == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("status", "FAILED", "message", "Loan not found"));
            }
            return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Loan admin fields updated"));
        }
}
