import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/models.dart';

class PriceMiniCard extends StatelessWidget {
  final CryptoPrice crypto;
  const PriceMiniCard({super.key, required this.crypto});

  @override
  Widget build(BuildContext context) {
    final color = crypto.isPositive ? const Color(0xFF00FF88) : const Color(0xFFFF4444);
    final fmt = NumberFormat.currency(
      symbol: '\$',
      decimalDigits: crypto.currentPrice > 100 ? 0 : 4,
    );

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.04)),
      ),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                crypto.symbol.length > 3
                    ? crypto.symbol.substring(0, 3)
                    : crypto.symbol,
                style: TextStyle(
                  color: color,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              crypto.name,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w500,
                fontSize: 14,
              ),
            ),
          ),
          Text(
            fmt.format(crypto.currentPrice),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
          const SizedBox(width: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              '${crypto.isPositive ? '+' : ''}${crypto.priceChangePercentage24h.toStringAsFixed(2)}%',
              style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
