package bank.loan.workflow_service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PageResponse<T>(
    List<T> content
) {}
