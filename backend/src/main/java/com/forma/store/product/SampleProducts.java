package com.forma.store.product;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class SampleProducts implements CommandLineRunner {
    private final ProductRepository products;

    public SampleProducts(ProductRepository products) {
        this.products = products;
    }

    @Override
    public void run(String... args) {
        List<Product> samples = List.of(
                new Product("Forma ceramic vase", "Home", "Hand-finished stoneware with a soft, natural glaze.", new BigDecimal("48.00"), image("photo-1578500494198-246f612d3b3d"), "Bestseller", 12),
                new Product("Everyday linen throw", "Home", "A relaxed linen-cotton layer for quiet evenings.", new BigDecimal("86.00"), image("photo-1600210492486-724fe5c67fb0"), "New", 8),
                new Product("Arc table lamp", "Lighting", "Warm, diffused light with a sculptural metal base.", new BigDecimal("129.00"), image("photo-1507473885765-e6ed057f782c"), null, 6),
                new Product("Oak bedside table", "Furniture", "Solid oak, thoughtfully proportioned for small spaces.", new BigDecimal("245.00"), image("photo-1499933374294-4584851497cc"), null, 4),
                new Product("Sculpted candle holder", "Accessories", "A simple, weighty accent in cast brushed aluminum.", new BigDecimal("34.00"), image("photo-1603006905003-be475563bc59"), null, 15),
                new Product("Softline lounge chair", "Furniture", "An inviting seat in tactile fabric and warm ash.", new BigDecimal("590.00"), image("photo-1567538096630-e0c55bd6374c"), "Limited", 3),
                new Product("Pebble serving bowl", "Home", "A generously sized bowl, shaped and glazed by hand.", new BigDecimal("62.00"), image("photo-1490312278390-ab64016e0aa9"), null, 9),
                new Product("Everyday canvas tote", "Accessories", "A sturdy, easygoing carryall made from recycled cotton.", new BigDecimal("28.00"), image("photo-1544816155-12df9643f363"), null, 20),
                new Product("Ribbed glass tumbler set", "Home", "Four softly ribbed glasses for slow mornings and long dinners.", new BigDecimal("42.00"), image("photo-1513558161293-cdaf765edfd7"), "Set of 4", 14),
                new Product("Woven market basket", "Accessories", "A roomy handwoven basket for market days and weekend escapes.", new BigDecimal("54.00"), image("photo-1590874103328-eac38a683ce7"), null, 11),
                new Product("Gather pendant light", "Lighting", "A softly diffused pendant that brings warmth to any corner.", new BigDecimal("178.00"), image("photo-1507473885765-e6ed057f782c"), "New", 5),
                new Product("Low oak coffee table", "Furniture", "A low, solid-oak centerpiece with a calm, minimal profile.", new BigDecimal("420.00"), image("photo-1499933374294-4584851497cc"), null, 3),
                new Product("Pleated cotton cushion", "Home", "A textural cushion in washed cotton with an easy removable cover.", new BigDecimal("58.00"), image("photo-1584100936595-c0654b55a2e2"), null, 10),
                new Product("Brushed steel tray", "Accessories", "A softly rounded catchall for the things you reach for each day.", new BigDecimal("39.00"), image("photo-1603199506016-b9a594b593c0"), null, 13),
                new Product("Wall-mounted reading light", "Lighting", "A compact directional light for a favorite book and quiet hour.", new BigDecimal("112.00"), image("photo-1507473885765-e6ed057f782c"), null, 7),
                new Product("Ashwood dining chair", "Furniture", "A clean-lined ash frame paired with a handwoven natural seat.", new BigDecimal("285.00"), image("photo-1505693416388-ac5ce068fe85"), null, 4),
                new Product("Ripple ceramic mug", "Home", "An everyday mug with a gently uneven rim and a comfortable handle.", new BigDecimal("26.00"), image("photo-1514228742587-6b1558fcca3d"), "Settle in", 18),
                new Product("Natural cotton bath mat", "Home", "A thick, quick-drying cotton mat woven for a little everyday comfort.", new BigDecimal("46.00"), image("photo-1620626011761-996317b8d101"), null, 12),
                new Product("Rounded oak wall hook", "Accessories", "A solid wood hook with a friendly rounded profile. Sold individually.", new BigDecimal("18.00"), image("photo-1618221195710-dd6b41faaea6"), null, 25),
                new Product("Fluted stoneware planter", "Home", "A tactile planter with a matching drainage tray, made for leafy corners.", new BigDecimal("52.00"), image("photo-1485955900006-10f4d324d411"), null, 10),
                new Product("Paper shade table light", "Lighting", "An airy, folded shade casts a soft and comforting evening glow.", new BigDecimal("148.00"), image("photo-1507473885765-e6ed057f782c"), "New", 6),
                new Product("Everyday wool rug", "Home", "A naturally soft, low-pile wool rug to bring warmth underfoot.", new BigDecimal("340.00"), image("photo-1600166898405-da9535204843"), null, 3),
                new Product("Handwoven storage basket", "Accessories", "A versatile woven basket for blankets, toys, or a tidy hallway.", new BigDecimal("68.00"), image("photo-1590874103328-eac38a683ce7"), null, 9),
                new Product("Slatted oak bench", "Furniture", "An uncomplicated oak bench for the entryway, bedroom, or dining table.", new BigDecimal("310.00"), image("photo-1499933374294-4584851497cc"), null, 4),
                new Product("Linen table runner", "Home", "Pre-washed linen with a relaxed drape for weeknights and celebrations.", new BigDecimal("44.00"), image("photo-1603199506016-b9a594b593c0"), null, 14),
                new Product("Curved brass bookend", "Accessories", "A quietly sculptural bookend cast in satin-finish solid brass.", new BigDecimal("72.00"), image("photo-1507842217343-583bb7270b66"), "Pair", 7),
                new Product("Dome wall sconce", "Lighting", "A simple directional wall light with a warm, matte finish.", new BigDecimal("136.00"), image("photo-1507473885765-e6ed057f782c"), null, 5),
                new Product("Rounded side table", "Furniture", "A compact side table in natural ash, made for just-beside-you things.", new BigDecimal("198.00"), image("photo-1499933374294-4584851497cc"), null, 6)
        );
        List<Product> newProducts = samples.stream()
                .filter(product -> products.findByName(product.getName()).isEmpty())
                .toList();
        if (!newProducts.isEmpty()) {
            products.saveAll(newProducts);
        }
    }

    private String image(String photoId) {
        return "https://images.unsplash.com/" + photoId + "?auto=format&fit=crop&w=900&q=80";
    }
}
