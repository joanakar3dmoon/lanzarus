import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:fl_chart/fl_chart.dart';
import '../providers/app_provider.dart';
import '../models/models.dart';
import '../widgets/banner_ad_widget.dart';

class MarketScreen extends StatelessWidget {
  const MarketScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<AppProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mercado'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: prov.fetchPrices,
          ),
        ],
      ),
      body: prov.loadingPrices
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF00D4FF)))
          : RefreshIndicator(
              color: const Color(0xFF00D4FF),
              backgroundColor: const Color(0xFF1A1A2E),
              onRefresh: prov.fetchPrices,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  const BannerAdWidget(),
                  const SizedBox(height: 16),
                  ...prov.prices.map((p) => _CryptoCard(crypto: p)),
                  const SizedBox(height: 80),
                ],
              ),
            ),
    );
  }
}

class _CryptoCard extends StatelessWidget {
  final CryptoPrice crypto;
  const _CryptoCard({required this.crypto});

  @override
  Widget build(BuildContext context) {
    final fmtPrice = NumberFormat.currency(symbol: '\$', decimalDigits: crypto.currentPrice > 100 ? 0 : 4);
    final color = crypto.isPositive ? const Color(0xFF00FF88) : const Color(0xFFFF4444);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          // Icon
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                crypto.symbol.substring(0, crypto.symbol.length > 3 ? 3 : crypto.symbol.length),
                style: TextStyle(
                  color: color,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Name
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  crypto.name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                  ),
                ),
                Text(
                  crypto.symbol,
                  style: const TextStyle(color: Color(0xFF888888), fontSize: 12),
                ),
              ],
            ),
          ),
          // Sparkline
          if (crypto.sparkline.length > 4)
            SizedBox(
              width: 60,
              height: 30,
              child: LineChart(
                LineChartData(
                  gridData: const FlGridData(show: false),
                  titlesData: const FlTitlesData(show: false),
                  borderData: FlBorderData(show: false),
                  lineTouchData: const LineTouchData(enabled: false),
                  lineBarsData: [
                    LineChartBarData(
                      spots: List.generate(
                        crypto.sparkline.length,
                        (i) => FlSpot(i.toDouble(), crypto.sparkline[i]),
                      ),
                      isCurved: true,
                      color: color,
                      barWidth: 1.5,
                      dotData: const FlDotData(show: false),
                      belowBarData: BarAreaData(
                        show: true,
                        color: color.withOpacity(0.1),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          const SizedBox(width: 12),
          // Price
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                fmtPrice.format(crypto.currentPrice),
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '${crypto.isPositive ? '+' : ''}${crypto.priceChangePercentage24h.toStringAsFixed(2)}%',
                  style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
