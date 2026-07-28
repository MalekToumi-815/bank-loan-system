package bank.loan.account_service.model;

import java.util.List;

public enum Role {
    CLIENT(List.of(
        "CREATE-LOAN",
        "VIEW-LOAN"
    )),
    
    BANK_RECEPTIONIST(List.of(
        "VIEW-LOAN", 
        "VIEW-TASK",
        "COMPLETE-TASK"
    )),
    
    LOAN_OFFICER(List.of(
        "VIEW-LOAN", 
        "VIEW-TASK",
        "COMPLETE-TASK"
    )),
    
    BANK_ADMIN(List.of(
        "VIEW-LOAN", 
        "VIEW-TASK",
        "COMPLETE-TASK",
        "MANAGE-USERS",
        "MANAGE-LOANS",
        "MANAGE-WORKFLOW"
    ));

    private final List<String> permissions;

    // Constructor to bind permissions to the role
    Role(List<String> permissions) {
        this.permissions = permissions;
    }

    // Getter to retrieve the permissions list
    public List<String> getPermissions() {
        return permissions;
    }
}