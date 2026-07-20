class AppData {
  final double balance;
  final double investedCapital;
  final double monthlyEarnings;
  final int totalWorkers;
  final int activeWorkers;
  final String status;

  AppData({
    required this.balance,
    required this.investedCapital,
    required this.monthlyEarnings,
    required this.totalWorkers,
    required this.activeWorkers,
    required this.status,
  });

  factory AppData.fromJson(Map<String, dynamic> j) {
    return AppData(
      balance: (j['balance'] ?? j['totalEarnings'] ?? 0).toDouble(),
      investedCapital: (j['investedCapital'] ?? j['lockedCapital'] ?? 0).toDouble(),
      monthlyEarnings: (j['monthlyEarnings'] ?? j['dailyEarnings'] ?? 0).toDouble(),
      totalWorkers: (j['totalWorkers'] ?? j['workers'] ?? 0) is List
          ? (j['totalWorkers'] ?? j['workers']).length
          : (j['totalWorkers'] ?? 3),
      activeWorkers: (j['activeWorkers'] ?? 2),
      status: j['status'] ?? 'active',
    );
  }

  factory AppData.demo() {
    return AppData(
      balance: 5000.0,
      investedCapital: 1250.0,
      monthlyEarnings: 87.5,
      totalWorkers: 3,
      activeWorkers: 2,
      status: 'demo',
    );
  }
}

class CryptoPrice {
  final String id;
  final String symbol;
  final String name;
  final String image;
  final double currentPrice;
  final double priceChange24h;
  final double priceChangePercentage24h;
  final double marketCap;
  final List<double> sparkline;

  CryptoPrice({
    required this.id,
    required this.symbol,
    required this.name,
    required this.image,
    required this.currentPrice,
    required this.priceChange24h,
    required this.priceChangePercentage24h,
    required this.marketCap,
    required this.sparkline,
  });

  bool get isPositive => priceChangePercentage24h >= 0;

  factory CryptoPrice.fromJson(Map<String, dynamic> j) {
    List<double> spark = [];
    try {
      final sp = j['sparkline_in_7d']?['price'] as List?;
      if (sp != null) {
        spark = sp.map((e) => (e as num).toDouble()).toList();
      }
    } catch (_) {}
    return CryptoPrice(
      id: j['id'] ?? '',
      symbol: (j['symbol'] ?? '').toUpperCase(),
      name: j['name'] ?? '',
      image: j['image'] ?? '',
      currentPrice: (j['current_price'] ?? 0).toDouble(),
      priceChange24h: (j['price_change_24h'] ?? 0).toDouble(),
      priceChangePercentage24h: (j['price_change_percentage_24h'] ?? 0).toDouble(),
      marketCap: (j['market_cap'] ?? 0).toDouble(),
      sparkline: spark,
    );
  }

  static List<CryptoPrice> demoList() {
    return [
      CryptoPrice(id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', image: '',
          currentPrice: 67420, priceChange24h: 1250, priceChangePercentage24h: 1.88,
          marketCap: 1320000000000, sparkline: [65000, 66000, 65500, 67000, 67420]),
      CryptoPrice(id: 'ethereum', symbol: 'ETH', name: 'Ethereum', image: '',
          currentPrice: 3540, priceChange24h: -45, priceChangePercentage24h: -1.25,
          marketCap: 425000000000, sparkline: [3600, 3580, 3520, 3550, 3540]),
      CryptoPrice(id: 'solana', symbol: 'SOL', name: 'Solana', image: '',
          currentPrice: 178, priceChange24h: 8.5, priceChangePercentage24h: 5.01,
          marketCap: 82000000000, sparkline: [165, 170, 172, 175, 178]),
      CryptoPrice(id: 'cardano', symbol: 'ADA', name: 'Cardano', image: '',
          currentPrice: 0.58, priceChange24h: -0.02, priceChangePercentage24h: -3.33,
          marketCap: 20500000000, sparkline: [0.61, 0.60, 0.59, 0.58, 0.58]),
      CryptoPrice(id: 'ripple', symbol: 'XRP', name: 'XRP', image: '',
          currentPrice: 0.62, priceChange24h: 0.015, priceChangePercentage24h: 2.48,
          marketCap: 34000000000, sparkline: [0.60, 0.61, 0.61, 0.62, 0.62]),
    ];
  }
}
