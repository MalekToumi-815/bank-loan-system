package bank.loan.credit_service.service;

import java.time.ZoneId;
import java.util.Date;
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
import bank.loan.credit_service.model.Ammortisation;
import bank.loan.credit_service.model.Installement;
import bank.loan.credit_service.model.Loan;
import bank.loan.credit_service.model.LoanStatus;
import bank.loan.credit_service.model.RiskAssessment;
import bank.loan.credit_service.model.RiskScore;
import bank.loan.credit_service.model.Role;
import bank.loan.credit_service.repository.LoanRepository;
import bank.loan.credit_service.repository.RiskAssessmentRepository;
import jakarta.transaction.Transactional;

@Service
public class LoanService {

    private final LoanRepository loanRepository;
    private final RiskAssessmentRepository riskAssessmentRepository;
    private final RestClient restClient;
    private final String internalSecret;

    public LoanService(LoanRepository loanRepository,
                       RiskAssessmentRepository riskAssessmentRepository,
                       RestClient.Builder restClientBuilder,
                       @Value("${internal.shared-secret}") String internalSecret) {
        this.loanRepository = loanRepository;
        this.riskAssessmentRepository = riskAssessmentRepository;
        this.restClient = restClientBuilder.build();
        this.internalSecret = internalSecret;
    }

    // Basic CRUD operations for Loan entity
    public Loan getLoanById(Long id) {
        return loanRepository.findById(id).orElse(null);
    }

    public List<Loan> getAllLoans(Long userId) {
        if (userId != null) {
            return loanRepository.findByClientId(userId);
        }
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
                        loan.setStartDate(task.startDate());
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

            return user != null;
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
                        .body(Map.of("status", "FAILED", "message", "User does not exist"));
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

    public ResponseEntity<List<LoanResponse>> getAllLoansResponse(Long userId) {
        List<LoanResponse> loans = getAllLoans(userId).stream()
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

    public ResponseEntity<Map<String, Object>> createRiskAssessmentResponse(Long loanId, Map<String, String> payload) {
        Loan loan = loanRepository.findById(loanId).orElse(null);
        if (loan == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("status", "FAILED", "message", "Loan not found"));
        }

        if (riskAssessmentRepository.findByLoanId(loanId).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("status", "FAILED", "message", "Risk assessment already exists for this loan"));
        }

        RiskScore riskScore = RiskScore.valueOf(payload.get("riskScore"));
        String recommendation = payload.get("recommendation");
        RiskAssessment riskAssessment = new RiskAssessment(loan, riskScore, recommendation);
        riskAssessmentRepository.save(riskAssessment);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "status", "SUCCESS",
                        "message", "Risk assessment created",
                        "loanId", loanId,
                        "riskScore", riskAssessment.getRiskScore().name(),
                        "recommendation", riskAssessment.getRecommendation()));
    }

    public ResponseEntity<Map<String, Object>> getRiskAssessmentByLoanIdResponse(Long loanId) {
        RiskAssessment riskAssessment = riskAssessmentRepository.findByLoanId(loanId).orElse(null);
        if (riskAssessment == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("status", "FAILED", "message", "Risk assessment not found"));
        }

        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "loanId", loanId,
                "riskScore", riskAssessment.getRiskScore().name(),
                "recommendation", riskAssessment.getRecommendation(),
                "assessmentDate", riskAssessment.getAssessmentDate()));
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

        //Ammortisation related methods

        @Transactional 
        public ResponseEntity<Map<String, String>> createAmmortisationResponse(Long loanId) {
            Loan loan = loanRepository.findById(loanId).orElse(null);
            if (loan == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("status", "FAILED", "message", "Loan not found"));
            }
        
            // Safety check for startDate
            Date startDate = loan.getStartDate();
            if (startDate == null) {
                startDate = new Date(); // Or throw a bad request exception
                loan.setStartDate(startDate);
            }
        
            // Calculate end date based on start date and duration
            Date endDate = Date.from(
                startDate.toInstant()
                        .atZone(ZoneId.systemDefault())
                        .toLocalDate()
                        .plusMonths(loan.getDurationMonths())
                        .atStartOfDay(ZoneId.systemDefault())
                        .toInstant()
            );
        
            // Create ammortisation object
            Ammortisation ammortisation = new Ammortisation(loan, startDate, endDate, loan.getDurationMonths());
            
            // Generate installments BEFORE saving the parent loan/ammortisation
            generateInstallements(ammortisation);
            
            // Set relation & save everything atomically
            loan.setAmmortisation(ammortisation);
            loanRepository.save(loan);
        
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("status", "SUCCESS", "message", "Ammortisation created for loan ID: " + loanId));
        }
        
        private void generateInstallements(Ammortisation ammortisation) {
            java.util.ArrayList<Installement> installements = new java.util.ArrayList<>();
            //calculate installement amount
            float interestammount = ammortisation.getLoan().getAmount() * (ammortisation.getLoan().getInterestRate() / 100);
            float totalAmount = ammortisation.getLoan().getAmount() + interestammount;
            float installementAmount = totalAmount / ammortisation.getNumberofInstalments();
            Date startDate = ammortisation.getStartDate();
            for (int i = 1; i <= ammortisation.getNumberofInstalments(); i++) {
                Date dueDate = Date.from(
                    startDate.toInstant()
                            .atZone(ZoneId.systemDefault())
                            .toLocalDate()
                            .plusMonths(i)
                            .atStartOfDay(ZoneId.systemDefault())
                            .toInstant()
                );
                Installement installement = new Installement(ammortisation, dueDate, installementAmount);
                installements.add(installement);
            }
            ammortisation.setInstallements(installements);
        }
}
