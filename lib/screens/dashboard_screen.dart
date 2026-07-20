import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/app_provider.dart';
import '../widgets/banner_ad_widget.dart';
import '../widgets/stat_card.dart';
import '../widgets/price_mini_card.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _fmt = NumberFormat.currency(symbol: '\$', decimalDigits: 2);

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<AppProvider>();

    return Scaffold(
      body: RefreshIndicator(
        color: const Color(0xFF00D4FF),
        backgroundColor: const Color(0xFF1A1A2E),
        onRefresh: () async {
          await prov.fetchData();
          await prov.fetchPrices();
        },
        child: CustomScrollView(
          slivers: [
            // ── App Bar ──
            SliverAppBar(
              expandedHeight: 220,
              pinned: true,
              stretch: true,
              backgroundColor: const Color(0xFF0D0D1A),
              flexibleSpace: FlexibleSpaceBar(
                background: _buildHeader(prov),
                stretchModes: const [StretchMode.zoomBackground],
              ),
            ),

            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── Stats row ──
                    Row(
                      children: [
                        Expanded(
                          child: StatCard(
                            label: 'Invertido',
                            value: _fmt.format(prov.data?.investedCapital ?? 0),
                            icon: Icons.trending_up_rounded,
                            color: const Color(0xFF7B2FFF),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: StatCard(
                            label: 'Ganancias',
                            value: _fmt.format(prov.data?.monthlyEarnings ?? 0),
                            icon: Icons.attach_money_rounded,
                            color: const Color(0xFF00FF88),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: StatCard(
                            label: 'Trabajadores IA',
                            value: '${prov.data?.activeWorkers ?? 0}/${prov.data?.totalWorkers ?? 0}',
                            icon: Icons.smart_toy_rounded,
                            color: const Color(0xFF00D4FF),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: StatCard(
                            label: 'Estado',
                            value: prov.data?.status == 'demo' ? 'Demo' : 'Activo',
                            icon: Icons.circle,
                            color: prov.data?.status == 'demo'
                                ? Colors.orange
                                : const Color(0xFF00FF88),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // ── Ad Banner ──
                    const BannerAdWidget(),

                    const SizedBox(height: 24),

                    // ── Top Cryptos ──
                    const Text(
                      'Mercado en vivo',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),

                    if (prov.loadingPrices)
                      const Center(
                        child: CircularProgressIndicator(color: Color(0xFF00D4FF)),
                      )
                    else
                      ...prov.prices.take(5).map(
                        (p) => PriceMiniCard(crypto: p),
                      ),

                    const SizedBox(height: 80),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(AppProvider prov) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0D0D1A), Color(0xFF1A0A2E)],
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Bienvenido',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.6),
                          fontSize: 14,
                        ),
                      ),
                      const Text(
                        'Lanzarus',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF00D4FF).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFF00D4FF).withOpacity(0.4)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: Color(0xFF00FF88),
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 6),
                        const Text(
                          'En vivo',
                          style: TextStyle(color: Color(0xFF00D4FF), fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const Spacer(),
              Text(
                'Balance total',
                style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 13),
              ),
              const SizedBox(height: 4),
              prov.loading
                  ? const SizedBox(
                      height: 40,
                      child: CircularProgressIndicator(
                        color: Color(0xFF00D4FF), strokeWidth: 2,
                      ),
                    )
                  : Text(
                      _fmt.format(prov.totalBalance),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 36,
                        fontWeight: FontWeight.bold,
                        letterSpacing: -1,
                      ),
                    ),
              const SizedBox(height: 8),
              if (!prov.loading)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF00FF88).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '+${_fmt.format(prov.dailyGain)} este mes',
                    style: const TextStyle(
                      color: Color(0xFF00FF88),
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
