package com.forma.store.order;

import com.forma.store.product.Product;
import com.forma.store.product.ProductRepository;
import java.math.BigDecimal;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OrderService {
    private final ProductRepository products;
    private final ShopOrderRepository orders;

    public OrderService(ProductRepository products, ShopOrderRepository orders) {
        this.products = products;
        this.orders = orders;
    }

    @Transactional
    public OrderResponse placeOrder(CreateOrderRequest request) {
        ShopOrder order = new ShopOrder(request.customerName(), request.email(), request.address());
        BigDecimal total = BigDecimal.ZERO;

        for (OrderLineRequest line : request.items()) {
            Product product = products.findById(line.productId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "A selected product no longer exists."));
            if (product.getStock() < line.quantity()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, product.getName() + " does not have enough stock.");
            }

            product.setStock(product.getStock() - line.quantity());
            order.addItem(new OrderItem(product.getName(), line.quantity(), product.getPrice()));
            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(line.quantity())));
        }

        order.setTotal(total);
        ShopOrder savedOrder = orders.save(order);
        return new OrderResponse(savedOrder.getId(), savedOrder.getTotal(), "confirmed");
    }
}
