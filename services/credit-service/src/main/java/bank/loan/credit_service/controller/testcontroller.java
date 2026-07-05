package bank.loan.credit_service.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;


@RestController
@RequestMapping("/test")
public class testcontroller {
    @GetMapping("")
    public String getMethodName() {
        return new String("Hello credit-service");
    }
    
}
