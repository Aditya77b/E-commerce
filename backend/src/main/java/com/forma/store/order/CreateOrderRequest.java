package com.forma.store.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record CreateOrderRequest(
        @NotBlank String customerName,
        @NotBlank @Email String email,
        @NotBlank String address,
        @NotEmpty List<@Valid OrderLineRequest> items
) {
}
