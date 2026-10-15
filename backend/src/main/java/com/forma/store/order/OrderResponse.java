package com.forma.store.order;

import java.math.BigDecimal;

public record OrderResponse(Long id, BigDecimal total, String status) {
}
