import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/app_provider.dart';
import '../widgets/banner_ad_widget.dart';

class PortfolioScreen extends StatelessWidget {
  const PortfolioScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<AppProvider>();
    final fmt = NumberFormat.currency(symbol: '\$', decimalDigits: 2);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Cartera'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: prov.fetchData,
          ),
        ],
      ),
      body: RefreshIndicator(
        color: const Color(0xFF00D4FF),
        backgroundColor: const Color(0xFF1A1A2E),
        onRefresh: prov.fetchData,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // ── Balance card ──
            _buildBalanceCard(context, prov, fmt),
            const SizedBox(height: 16),

            // ── Workers ──
            _buildWorkersCard(prov),
            const SizedBox(height: 16),

            // ── Ad ──
            const BannerAdWidget(),
            const SizedBox(height: 16),

            // ── Transfer button ──
            _buildTransferButton(context, prov),
            const SizedBox(height: 80),
          ],
        ),
      ),
    );
  }

  Widget _buildBalanceCard(BuildContext context, AppProvider prov, NumberFormat fmt) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1A0A2E), Color(0xFF0A1A2E)],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF7B2FFF).withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Balance total',
                style: TextStyle(color: Color(0xFFAAAAAA), fontSize: 14),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF00FF88).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  '▲ Activo',
                  style: TextStyle(
                    color: Color(0xFF00FF88),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            fmt.format(prov.totalBalance),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.bold,
              letterSpacing: -1,
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              _BalanceStat(
                label: 'Disponible',
                value: fmt.format(prov.data?.balance ?? 0),
                color: const Color(0xFF00D4FF),
              ),
              const SizedBox(width: 16),
              _BalanceStat(
                label: 'Invertido',
                value: fmt.format(prov.data?.investedCapital ?? 0),
                color: const Color(0xFF7B2FFF),
              ),
              const SizedBox(width: 16),
              _BalanceStat(
                label: 'Ganancias',
                value: fmt.format(prov.data?.monthlyEarnings ?? 0),
                color: const Color(0xFF00FF88),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildWorkersCard(AppProvider prov) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.smart_toy_rounded, color: Color(0xFF00D4FF), size: 20),
              SizedBox(width: 8),
              Text(
                'Trabajadores IA',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: List.generate(
              prov.data?.totalWorkers ?? 3,
              (i) => Expanded(
                child: Container(
                  margin: EdgeInsets.only(right: i < (prov.data?.totalWorkers ?? 3) - 1 ? 8 : 0),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: i < (prov.data?.activeWorkers ?? 2)
                        ? const Color(0xFF00D4FF).withOpacity(0.1)
                        : Colors.white.withOpacity(0.03),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: i < (prov.data?.activeWorkers ?? 2)
                          ? const Color(0xFF00D4FF).withOpacity(0.4)
                          : Colors.white.withOpacity(0.07),
                    ),
                  ),
                  child: Column(
                    children: [
                      Icon(
                        Icons.smart_toy_rounded,
                        color: i < (prov.data?.activeWorkers ?? 2)
                            ? const Color(0xFF00D4FF)
                            : const Color(0xFF555555),
                        size: 24,
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'W${i + 1}',
                        style: TextStyle(
                          color: i < (prov.data?.activeWorkers ?? 2)
                              ? Colors.white
                              : const Color(0xFF555555),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        i < (prov.data?.activeWorkers ?? 2) ? 'Activo' : 'Inactivo',
                        style: TextStyle(
                          color: i < (prov.data?.activeWorkers ?? 2)
                              ? const Color(0xFF00FF88)
                              : const Color(0xFF555555),
                          fontSize: 10,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTransferButton(BuildContext context, AppProvider prov) {
    return GestureDetector(
      onTap: () async {
        final result = await prov.transferEarnings();
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result),
              backgroundColor: result.startsWith('✅')
                  ? const Color(0xFF00FF88)
                  : const Color(0xFFFF4444),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          );
        }
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF7B2FFF), Color(0xFF00D4FF)],
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF7B2FFF).withOpacity(0.3),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.account_balance_wallet_rounded, color: Colors.white),
            SizedBox(width: 10),
            Text(
              'Transferir Ganancias',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BalanceStat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _BalanceStat({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Color(0xFF888888), fontSize: 11)),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}
