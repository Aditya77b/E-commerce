package com.forma.store.order;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.forma.store.product.Product;
import com.forma.store.product.ProductRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    @Mock
    private ProductRepository products;

    @Mock
    private ShopOrderRepository orders;

    @InjectMocks
    private OrderService orderService;

    @Test
    void placesOrderAndReducesStock() {
        Product product = new Product("Vase", "Home", "Stoneware vase", new BigDecimal("48.00"), "image", null, 5);
        when(products.findById(7L)).thenReturn(Optional.of(product));
        when(orders.save(any(ShopOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));
        CreateOrderRequest request = new CreateOrderRequest(
                "Alex Example",
                "alex@example.com",
                "1 Main Street",
                List.of(new OrderLineRequest(7L, 2))
        );

        OrderResponse response = orderService.placeOrder(request);

        assertEquals(new BigDecimal("96.00"), response.total());
        assertEquals(3, product.getStock());
        assertEquals("confirmed", response.status());
        verify(orders).save(any(ShopOrder.class));
    }

    @Test
    void rejectsOrderWhenStockIsInsufficient() {
        Product product = new Product("Vase", "Home", "Stoneware vase", new BigDecimal("48.00"), "image", null, 1);
        when(products.findById(7L)).thenReturn(Optional.of(product));
        CreateOrderRequest request = new CreateOrderRequest(
                "Alex Example",
                "alex@example.com",
                "1 Main Street",
                List.of(new OrderLineRequest(7L, 2))
        );

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> orderService.placeOrder(request)
        );

        assertEquals(409, exception.getStatusCode().value());
        assertEquals(1, product.getStock());
        verify(orders, never()).save(any(ShopOrder.class));
    }
}
