import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';

const String kBaseUrl = 'https://invergrow.vercel.app';

class AppProvider extends ChangeNotifier {
  // ── State ──────────────────────────────────────────────
  AppData? _data;
  bool _loading = false;
  bool _error = false;
  String _errorMsg = '';
  List<CryptoPrice> _prices = [];
  bool _loadingPrices = false;
  String _aiResponse = '';
  bool _loadingAi = false;
  List<String> _chatHistory = [];

  // ── Getters ────────────────────────────────────────────
  AppData? get data => _data;
  bool get loading => _loading;
  bool get error => _error;
  String get errorMsg => _errorMsg;
  List<CryptoPrice> get prices => _prices;
  bool get loadingPrices => _loadingPrices;
  String get aiResponse => _aiResponse;
  bool get loadingAi => _loadingAi;
  List<String> get chatHistory => _chatHistory;

  double get totalBalance => (_data?.balance ?? 0) + (_data?.investedCapital ?? 0);
  double get dailyGain => _data?.monthlyEarnings ?? 0;

  AppProvider() {
    fetchData();
    fetchPrices();
  }

  // ── Fetch InverGrow data ──────────────────────────────
  Future<void> fetchData() async {
    _loading = true;
    _error = false;
    notifyListeners();
    try {
      final res = await http.get(Uri.parse('$kBaseUrl/api/data'))
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        _data = AppData.fromJson(jsonDecode(res.body));
      } else {
        _data = AppData.demo();
      }
    } catch (_) {
      _data = AppData.demo();
    }
    _loading = false;
    notifyListeners();
  }

  // ── Fetch CoinGecko prices ─────────────────────────────
  Future<void> fetchPrices() async {
    _loadingPrices = true;
    notifyListeners();
    try {
      final res = await http.get(Uri.parse(
        'https://api.coingecko.com/api/v3/coins/markets'
        '?vs_currency=usd&order=market_cap_desc&per_page=20&page=1'
        '&sparkline=true&price_change_percentage=24h',
      )).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final List list = jsonDecode(res.body);
        _prices = list.map((e) => CryptoPrice.fromJson(e)).toList();
      }
    } catch (_) {
      _prices = CryptoPrice.demoList();
    }
    _loadingPrices = false;
    notifyListeners();
  }

  // ── Ask AI ─────────────────────────────────────────────
  Future<void> askAI(String prompt) async {
    _loadingAi = true;
    _chatHistory.add('👤 $prompt');
    notifyListeners();
    try {
      final res = await http.post(
        Uri.parse('$kBaseUrl/api/ai/generate'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'prompt': prompt}),
      ).timeout(const Duration(seconds: 20));
      if (res.statusCode == 200) {
        final body = jsonDecode(res.body);
        _aiResponse = body['response'] ?? body['result'] ?? 'Sin respuesta';
      } else {
        _aiResponse = '⚠️ Error al conectar con el servidor IA.';
      }
    } catch (_) {
      _aiResponse = '⚠️ No se pudo conectar. Revisa tu conexión.';
    }
    _chatHistory.add('🤖 $_aiResponse');
    _loadingAi = false;
    notifyListeners();
  }

  // ── Transfer earnings ──────────────────────────────────
  Future<String> transferEarnings() async {
    try {
      final res = await http.post(
        Uri.parse('$kBaseUrl/api/ai/transfer-earnings'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({}),
      ).timeout(const Duration(seconds: 15));
      if (res.statusCode == 200) {
        await fetchData();
        return '✅ Ganancias transferidas correctamente';
      }
      return '❌ Error al transferir';
    } catch (_) {
      return '❌ Sin conexión';
    }
  }

  void clearChat() {
    _chatHistory.clear();
    _aiResponse = '';
    notifyListeners();
  }
}
