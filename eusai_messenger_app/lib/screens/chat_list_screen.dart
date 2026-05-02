import 'dart:async';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import 'chat_screen.dart';

class ChatListScreen extends StatefulWidget {
  const ChatListScreen({super.key});

  @override
  State<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends State<ChatListScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<dynamic> _channels = [];
  List<dynamic> _notifications = [];
  List<dynamic> _users = [];
  dynamic _selectedChannel;
  bool _isLoading = true;
  bool _isDetailsOpen = true; 
  String _currentView = 'CHAT'; 
  String _currentEmail = ''; 
  String _searchQuery = '';
  Timer? _pollingTimer;

  @override
  void initState() {
    super.initState();
    _currentEmail = context.read<ApiService>().currentUserEmail;
    _loadData();
    _startPolling();
  }

  void _startPolling() {
    _pollingTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      _loadData();
    });
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final api = context.read<ApiService>();
    final channels = await api.fetchChannels();
    final notifications = await api.fetchNotifications();
    final users = await api.fetchUsers();
    
    if (mounted) {
      print('TACTICAL_PULSE: Syncing ${channels.length} channels at ${DateTime.now()}');
      setState(() {
        _channels = List.from(channels);
        _notifications = notifications;
        _users = users;
        _isLoading = false;
        if (_channels.isNotEmpty && _selectedChannel == null) {
          _selectedChannel = _channels[0];
        }
      });
    }
  }

  String _getChannelName(dynamic channel) {
    if (channel['type'] != 'DIRECT') return channel['name'] ?? 'Unnamed';
    
    final members = channel['members'] as List<dynamic>?;
    final String defaultName = channel['name'] ?? 'Private Chat';
    
    if (members == null || members.isEmpty) return defaultName;
    
    final api = context.read<ApiService>();
    final String myId = api.currentUserId.toLowerCase().trim();
    final String myName = api.currentUserName.toLowerCase().trim();
    
    try {
      // 1. Identify "The Other" operative
      for (var m in members) {
        final String mId = (m['id'] ?? '').toString().toLowerCase().trim();
        final String mName = (m['name'] ?? '').toString().toLowerCase().trim();
        
        // If this member is NOT me, return their name
        if (mId.isNotEmpty && mId != myId) return m['name'] ?? 'Unknown User';
        if (mName.isNotEmpty && mName != myName) return m['name'] ?? 'Unknown User';
      }
      
      // 2. Fallback: If we only found ourselves, check if the channel name is useful
      if (defaultName.toLowerCase().trim() != myName) {
        return defaultName;
      }
    } catch (e) {
      debugPrint('TACTICAL_NAMING_ERROR: $e');
    }
    
    return defaultName;
  }

  void _switchView(String view) {
    setState(() => _currentView = view);
    if (view == 'CHAT' && _channels.isNotEmpty && _selectedChannel == null) {
      _selectedChannel = _channels[0];
    }
  }

  Future<void> _startDM(dynamic user) async {
    final api = context.read<ApiService>();
    final newChannel = await api.createChannel(user['name'], 'DIRECT', [user['id']]);
    if (newChannel != null) {
      await _loadData();
      setState(() {
        _selectedChannel = newChannel;
        _currentView = 'CHAT';
      });
    }
  }

  Future<void> _showCreateGroupDialog() async {
    final api = context.read<ApiService>();
    final TextEditingController nameCtrl = TextEditingController();
    String groupType = 'PUBLIC';

    return showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => AlertDialog(
          backgroundColor: const Color(0xFF0D0D0D),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24), side: BorderSide(color: Colors.white.withOpacity(0.05))),
          title: const Text('ESTABLISH TACTICAL GROUP', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, letterSpacing: 1)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'Group Name',
                  hintStyle: const TextStyle(color: Colors.white10),
                  filled: true,
                  fillColor: Colors.white.withOpacity(0.02),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  _buildTypeChoice('PUBLIC', groupType == 'PUBLIC', () => setModalState(() => groupType = 'PUBLIC')),
                  const SizedBox(width: 12),
                  _buildTypeChoice('PRIVATE', groupType == 'PRIVATE', () => setModalState(() => groupType = 'PRIVATE')),
                ],
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('ABORT', style: TextStyle(color: Colors.white24, fontSize: 11, fontWeight: FontWeight.w900))),
            ElevatedButton(
              onPressed: () async {
                if (nameCtrl.text.isNotEmpty) {
                  final success = await api.createChannel(nameCtrl.text, groupType, []);
                  if (success != null) {
                    await _loadData();
                    Navigator.pop(context);
                  }
                }
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.eusaiBlue, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              child: const Text('INITIALIZE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTypeChoice(String label, bool active, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: active ? AppTheme.eusaiBlue.withOpacity(0.1) : Colors.white.withOpacity(0.02),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: active ? AppTheme.eusaiBlue : Colors.white.withOpacity(0.05)),
          ),
          child: Center(child: Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: active ? AppTheme.eusaiBlue : Colors.white24))),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bool isWide = MediaQuery.of(context).size.width > 900;
    
    if (_isLoading) {
      return Scaffold(
        backgroundColor: AppTheme.blackMain,
        body: const Center(child: CircularProgressIndicator(color: AppTheme.eusaiNeon)),
      );
    }

    if (!isWide) {
      return Scaffold(
        backgroundColor: AppTheme.blackMain,
        appBar: _buildMobileAppBar(),
        body: _buildMobileMainView(),
        bottomNavigationBar: _buildMobileBottomNav(),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.blackMain,
      body: Row(
        children: [
          _buildLeftRail(),
          Container(
            width: 280,
            decoration: BoxDecoration(
              color: AppTheme.blackSidebar,
              border: Border(right: BorderSide(color: Colors.white.withOpacity(0.05))),
            ),
            child: SafeArea(
              child: Column(
                children: [
                  _buildSearchHeader(),
                  Expanded(
                    child: _buildSidebarContent(),
                  ),
                  _buildCurrentUserTile(),
                ],
              ),
            ),
          ),
          Expanded(child: _buildMainWorkspace()),
          if (_isDetailsOpen && _selectedChannel != null && _currentView == 'CHAT') _buildDetailsPanel(),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildMobileAppBar() {
    return AppBar(
      backgroundColor: AppTheme.blackMain,
      elevation: 0,
      centerTitle: false,
      title: Row(
        children: [
          Container(
            width: 32, height: 32,
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.03),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.white.withOpacity(0.05)),
            ),
            child: Image.asset('assets/EUSAI-LOGO.png', fit: BoxFit.contain),
          ),
          const SizedBox(width: 12),
          Text(_currentView == 'PEOPLE' ? 'OPERATIVES' : _currentView == 'ACTIVITY' ? 'ACTIVITY' : 'EUSAI HUB', 
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
        ],
      ),
      actions: [
        _buildNotificationBadge(),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildMobileBottomNav() {
    return Container(
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: Colors.white.withOpacity(0.05))),
      ),
      child: BottomNavigationBar(
        currentIndex: _currentView == 'ACTIVITY' ? 0 : _currentView == 'CHAT' ? 1 : 2,
        onTap: (index) {
          setState(() {
            if (index == 0) _currentView = 'ACTIVITY';
            else if (index == 1) _currentView = 'CHAT';
            else _currentView = 'PEOPLE';
          });
        },
        backgroundColor: AppTheme.blackMain,
        selectedItemColor: AppTheme.eusaiNeon,
        unselectedItemColor: Colors.white24,
        selectedLabelStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900),
        unselectedLabelStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900),
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(LucideIcons.bell, size: 20), label: 'ACTIVITY'),
          BottomNavigationBarItem(icon: Icon(LucideIcons.messageSquare, size: 20), label: 'HOME'),
          BottomNavigationBarItem(icon: Icon(LucideIcons.users, size: 20), label: 'OPERATIVES'),
        ],
      ),
    );
  }

  Widget _buildNotificationBadge() {
    final count = _notifications.where((n) => n['status'] == 'UNREAD').length;
    return Stack(
      children: [
        IconButton(icon: const Icon(LucideIcons.bell, size: 20), onPressed: () => setState(() => _currentView = 'ACTIVITY')),
        if (count > 0)
          Positioned(
            right: 8, top: 8,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
              child: Text(count.toString(), style: const TextStyle(fontSize: 8, color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ),
      ],
    );
  }

  Widget _buildMobileMainView() {
    switch (_currentView) {
      case 'ACTIVITY': return _buildMobileActivityView();
      case 'PEOPLE': return _buildPeopleSidebar();
      default: return _buildMobileHomeView();
    }
  }

  Widget _buildMobileHomeView() {
    final filteredChannels = _channels.where((c) => _getChannelName(c).toLowerCase().contains(_searchQuery.toLowerCase())).toList();
    final announcements = filteredChannels.where((c) => (c['type'] == 'ANNOUNCEMENT' || c['name']?.toLowerCase().contains('announcement') == true)).toList();
    final sectors = filteredChannels.where((c) => c['type'] != 'DIRECT' && !c['name']?.toLowerCase().contains('announcement') == true).toList();
    final dms = filteredChannels.where((c) => c['type'] == 'DIRECT').toList();

    return RefreshIndicator(
      onRefresh: _loadData,
      color: AppTheme.eusaiNeon,
      backgroundColor: const Color(0xFF1A1A1A),
      child: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              child: Column(
                children: [
                  _buildMobileSearchField(),
                  const SizedBox(height: 24),
                  _buildWorkspaceHero(),
                ],
              ),
            ),
          ),
          if (announcements.isNotEmpty) ...[
            SliverToBoxAdapter(child: _buildSectionTitle('TACTICAL BROADCASTS')),
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) => _buildChannelTile(announcements[index], LucideIcons.hash),
                childCount: announcements.length,
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 24)),
          ],
          if (sectors.isNotEmpty) ...[
            SliverToBoxAdapter(child: _buildSectionTitle('OPERATIONAL SECTORS')),
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) => _buildChannelTile(sectors[index], LucideIcons.layers),
                childCount: sectors.length,
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 24)),
          ],
          if (dms.isNotEmpty) ...[
            SliverToBoxAdapter(child: _buildSectionTitle('DIRECT LINKS')),
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) => _buildChannelTile(dms[index], LucideIcons.atSign),
                childCount: dms.length,
              ),
            ),
          ],
          if (filteredChannels.isEmpty)
            SliverFillRemaining(child: _buildEmptyState()),
        ],
      ),
    );
  }

  Widget _buildMobileSearchField() {
    return Container(
      height: 48,
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: TextField(
        controller: _searchController,
        onChanged: (val) => setState(() => _searchQuery = val.toLowerCase()),
        style: const TextStyle(fontSize: 14),
        decoration: InputDecoration(
          hintText: 'Search sectors, broadcasts, or direct links...',
          hintStyle: TextStyle(fontSize: 13, color: Colors.white.withOpacity(0.15)),
          prefixIcon: Icon(LucideIcons.search, size: 16, color: Colors.white.withOpacity(0.15)),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 14),
          suffixIcon: _searchQuery.isNotEmpty 
            ? IconButton(
                icon: const Icon(LucideIcons.x, size: 14, color: Colors.white24),
                onPressed: () {
                  _searchController.clear();
                  setState(() => _searchQuery = '');
                },
              )
            : null,
        ),
      ),
    );
  }

  Widget _buildWorkspaceHero() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.white.withOpacity(0.05), Colors.white.withOpacity(0.01)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          Container(
            width: 52, height: 52,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.eusaiBlue.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Image.asset('assets/EUSAI-LOGO.png', fit: BoxFit.contain),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('EUSAI COMMAND CENTER', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, letterSpacing: 1)),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Container(
                      width: 6, height: 6,
                      decoration: const BoxDecoration(color: AppTheme.eusaiNeon, shape: BoxShape.circle),
                    ),
                    const SizedBox(width: 6),
                    Text('SECURE CONNECTION ACTIVE', style: TextStyle(fontSize: 9, color: Colors.white.withOpacity(0.3), fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      child: Text(title, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2, color: Colors.white.withOpacity(0.15))),
    );
  }

  Widget _buildChannelTile(dynamic channel, IconData icon) {
    final bool isSelected = _selectedChannel?['id'] == channel['id'];
    final int unreadCount = channel['_count']?['messages'] ?? 0;
    
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      decoration: BoxDecoration(
        color: isSelected ? AppTheme.eusaiNeon.withOpacity(0.05) : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isSelected ? AppTheme.eusaiNeon.withOpacity(0.1) : Colors.transparent),
      ),
      child: ListTile(
        onTap: () => _openChannel(channel),
        dense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        leading: Container(
          width: 32, height: 32,
          decoration: BoxDecoration(
            color: isSelected ? AppTheme.eusaiNeon.withOpacity(0.1) : Colors.white.withOpacity(0.02),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 16, color: isSelected ? AppTheme.eusaiNeon : Colors.white38),
        ),
        title: Text(
          _getChannelName(channel), 
          style: TextStyle(
            fontSize: 13, 
            fontWeight: isSelected || unreadCount > 0 ? FontWeight.w900 : FontWeight.w600,
            color: isSelected ? Colors.white : (unreadCount > 0 ? Colors.white : Colors.white38),
            letterSpacing: 0.3,
          )
        ),
        trailing: unreadCount > 0 
          ? Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.eusaiNeon, 
                borderRadius: BorderRadius.circular(20),
                boxShadow: [BoxShadow(color: AppTheme.eusaiNeon.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 2))],
              ),
              child: Text(unreadCount.toString(), style: const TextStyle(color: Colors.black, fontSize: 9, fontWeight: FontWeight.w900)),
            )
          : Icon(LucideIcons.chevronRight, size: 12, color: Colors.white.withOpacity(0.05)),
      ),
    );
  }

  void _openChannel(dynamic channel) {
    setState(() => _selectedChannel = channel);
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ChatScreen(
          channel: channel,
          onNameIdentified: _getChannelName(channel),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          children: [
            Icon(LucideIcons.shieldAlert, size: 48, color: Colors.white.withOpacity(0.05)),
            const SizedBox(height: 16),
            const Text('NO TACTICAL CHANNELS FOUND', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white12, letterSpacing: 2)),
          ],
        ),
      ),
    );
  }

  Widget _buildMobileActivityView() {
    final filtered = _notifications.where((n) => (n['title'] ?? '').toLowerCase().contains(_searchQuery) || (n['message'] ?? '').toLowerCase().contains(_searchQuery)).toList();
    return RefreshIndicator(
      onRefresh: _loadData,
      color: AppTheme.eusaiNeon,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: filtered.length,
        itemBuilder: (context, index) => _buildNotificationTile(filtered[index]),
      ),
    );
  }

  Widget _buildSidebarContent() {
    switch (_currentView) {
      case 'ACTIVITY': return _buildActivitySidebar();
      case 'PEOPLE': return _buildPeopleSidebar();
      default:
        final announcements = _channels.where((c) => (c['type'] == 'ANNOUNCEMENT' || c['name']?.toLowerCase().contains('announcement') == true) && _getChannelName(c).toLowerCase().contains(_searchQuery.toLowerCase())).toList();
        final sectors = _channels.where((c) => c['type'] != 'DIRECT' && !c['name']?.toLowerCase().contains('announcement') == true && _getChannelName(c).toLowerCase().contains(_searchQuery.toLowerCase())).toList();
        final dms = _channels.where((c) => c['type'] == 'DIRECT' && _getChannelName(c).toLowerCase().contains(_searchQuery.toLowerCase())).toList();

        return ListView(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          children: [
            if (announcements.isNotEmpty) _buildEusaiSection('ANNOUNCEMENTS', announcements, LucideIcons.hash),
            if (sectors.isNotEmpty) _buildEusaiSection('DEPARTMENTS', sectors, LucideIcons.layers),
            if (dms.isNotEmpty) _buildEusaiSection('DIRECT LINKS', dms, LucideIcons.atSign),
          ],
        );
    }
  }

  Widget _buildActivitySidebar() {
    final filtered = _notifications.where((n) => (n['title'] ?? '').toLowerCase().contains(_searchQuery) || (n['message'] ?? '').toLowerCase().contains(_searchQuery)).toList();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('RECENT ALERTS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2, color: Colors.white12)),
        const SizedBox(height: 16),
        ...filtered.map((n) => _buildNotificationTile(n)).toList(),
      ],
    );
  }

  Widget _buildNotificationTile(dynamic n) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.02), borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          const Icon(LucideIcons.bell, size: 14, color: AppTheme.eusaiNeon),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(n['title'] ?? 'Alert', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                Text(n['message'] ?? '', style: const TextStyle(fontSize: 10, color: Colors.white24)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPeopleSidebar() {
    final filtered = _users.where((u) => (u['name'] ?? '').toLowerCase().contains(_searchQuery)).toList();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('OPERATIVES DIRECTORY', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2, color: Colors.white12)),
        const SizedBox(height: 16),
        ...filtered.map((u) => _buildUserListTile(u)).toList(),
      ],
    );
  }

  Widget _buildUserListTile(dynamic u) {
    return ListTile(
      dense: true,
      onTap: () => _startDM(u),
      leading: Container(
        width: 32, height: 32,
        decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(10)),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: u['image'] != null 
            ? Image.network(u['image'], fit: BoxFit.cover, errorBuilder: (_, __, ___) => _buildInitials(u['name'])) 
            : _buildInitials(u['name']),
        ),
      ),
      title: Text(u['name'] ?? 'Unknown', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
      subtitle: Text(u['role']?.toString().toUpperCase() ?? 'STAFF', style: const TextStyle(fontSize: 8, color: Colors.white10)),
    );
  }

  Widget _buildInitials(String? name) {
    return Center(child: Text(name != null && name.isNotEmpty ? name[0] : '?', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white24)));
  }

  Widget _buildMainWorkspace() {
    if (_currentView == 'ACTIVITY') return _buildFullScreenActivity();
    if (_currentView == 'CHAT' && _selectedChannel != null) {
      return ChatScreen(
        key: ValueKey(_selectedChannel['id']),
        channel: _selectedChannel,
        isSplitView: true,
        onNameIdentified: _getChannelName(_selectedChannel),
        isDetailsOpen: _isDetailsOpen,
        onToggleDetails: () => setState(() => _isDetailsOpen = !_isDetailsOpen),
      );
    }
    return const Center(child: Icon(LucideIcons.shield, size: 48, color: Colors.white10));
  }

  Widget _buildFullScreenActivity() {
    final bool isWide = MediaQuery.of(context).size.width > 900;
    final filtered = _notifications.where((n) => (n['title'] ?? '').toLowerCase().contains(_searchQuery) || (n['message'] ?? '').toLowerCase().contains(_searchQuery)).toList();
    return Container(
      color: AppTheme.blackMain,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 72,
            padding: EdgeInsets.symmetric(horizontal: isWide ? 40 : 20),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: Colors.white.withOpacity(0.05))),
            ),
            child: Row(
              children: [
                Text(isWide ? 'TACTICAL ACTIVITY FEED' : 'ACTIVITY', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, letterSpacing: 2)),
                const Spacer(),
                Text('${filtered.length} ALERTS', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppTheme.eusaiNeon)),
              ],
            ),
          ),
          Expanded(
            child: GridView.builder(
              padding: EdgeInsets.all(isWide ? 40 : 16),
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: isWide ? 2 : 1, 
                crossAxisSpacing: 20, 
                mainAxisSpacing: 20, 
                childAspectRatio: isWide ? 3 : 4,
              ),
              itemCount: filtered.length,
              itemBuilder: (context, index) => _buildFullScreenNotificationTile(filtered[index]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFullScreenNotificationTile(dynamic n) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.02),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          Container(
            width: 48, height: 48,
            decoration: BoxDecoration(color: AppTheme.eusaiBlue.withOpacity(0.1), borderRadius: BorderRadius.circular(16)),
            child: const Icon(LucideIcons.bell, color: AppTheme.eusaiBlue, size: 20),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(n['title'] ?? 'Operational Alert', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(n['message'] ?? '', style: const TextStyle(fontSize: 12, color: Colors.white24)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailsPanel() {
    final members = _selectedChannel['members'] as List<dynamic>? ?? [];
    dynamic headerUser;
    if (_selectedChannel['type'] == 'DIRECT') {
      headerUser = members.firstWhere(
        (m) => m['email'] != _currentEmail && m['id'].toString() != context.read<ApiService>().currentUserId,
        orElse: () => members[0],
      );
    }

    return Container(
      width: 320,
      decoration: BoxDecoration(
        color: const Color(0xFF0D0D0D),
        border: Border(left: BorderSide(color: Colors.white.withOpacity(0.05))),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 64,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('DETAILS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 2, color: Colors.white24)),
                IconButton(icon: const Icon(LucideIcons.x, size: 14, color: Colors.white24), onPressed: () => setState(() => _isDetailsOpen = false)),
              ],
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(24),
              children: [
                Center(
                  child: Container(
                    width: 100, height: 100,
                    decoration: BoxDecoration(
                      color: AppTheme.eusaiBlue.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: AppTheme.eusaiBlue.withOpacity(0.1)),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(24),
                      child: (headerUser != null && headerUser['image'] != null)
                        ? Image.network(headerUser['image'], fit: BoxFit.cover, errorBuilder: (_, __, ___) => Image.asset('assets/EUSAI-LOGO.png'))
                        : Image.asset('assets/EUSAI-LOGO.png', fit: BoxFit.cover),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Center(child: Text(_selectedChannel['type'] == 'DIRECT' ? 'Private Communication' : 'Public tactical group.', style: const TextStyle(fontSize: 12, color: Colors.white24))),
                const SizedBox(height: 48),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('PERSONNEL', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1, color: Colors.white12)),
                    Container(
                      width: 16, height: 16,
                      decoration: const BoxDecoration(color: Colors.white10, shape: BoxShape.circle),
                      child: Center(child: Text('${members.length}', style: const TextStyle(fontSize: 8, color: Colors.white38))),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                ...members.map((m) => _buildMemberTile(m)).toList(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMemberTile(dynamic member) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(10)),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: member['image'] != null 
                ? Image.network(member['image'], fit: BoxFit.cover, errorBuilder: (_, __, ___) => _buildInitials(member['name']))
                : _buildInitials(member['name']),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(member['name'] ?? 'Unknown', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                Text(member['role']?.toString().toUpperCase() ?? 'MEMBER', style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.white10, letterSpacing: 1)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLeftRail() {
    return Container(
      width: 68,
      color: AppTheme.blackRail,
      child: Column(
        children: [
          const SizedBox(height: 12),
          _buildRailIcon(LucideIcons.bell, 'Activity', _currentView == 'ACTIVITY', 'ACTIVITY'),
          _buildRailIcon(LucideIcons.messageSquare, 'Chat', _currentView == 'CHAT', 'CHAT'),
          _buildRailIcon(LucideIcons.users, 'People', _currentView == 'PEOPLE', 'PEOPLE'),
          const Spacer(),
          _buildRailIcon(LucideIcons.settings, 'Settings', false, 'SETTINGS'),
          const SizedBox(height: 12),
        ],
      ),
    );
  }

  Widget _buildRailIcon(IconData icon, String label, bool active, String view) {
    return GestureDetector(
      onTap: () => _switchView(view),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        width: double.infinity,
        decoration: BoxDecoration(border: active ? const Border(left: BorderSide(color: AppTheme.eusaiNeon, width: 2)) : null),
        child: Column(
          children: [
            Icon(icon, size: 20, color: active ? AppTheme.eusaiNeon : Colors.white24),
            const SizedBox(height: 4),
            Text(label, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: active ? AppTheme.eusaiNeon : Colors.white24)),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchHeader() {
    final api = context.read<ApiService>();
    final bool canCreate = ['ADMIN', 'DIRECTOR', 'MANAGER'].contains(api.currentUserRole.toUpperCase());

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('WORKSPACE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2, color: Colors.white24)),
              if (canCreate)
                GestureDetector(
                  onTap: _showCreateGroupDialog,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(color: AppTheme.eusaiBlue.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                    child: const Icon(LucideIcons.plus, size: 14, color: AppTheme.eusaiBlue),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            height: 40,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.03),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.white.withOpacity(0.05)),
            ),
            child: TextField(
              controller: _searchController,
              onChanged: (val) => setState(() => _searchQuery = val.toLowerCase()),
              style: const TextStyle(fontSize: 13),
              decoration: const InputDecoration(
                hintText: 'Jump to...',
                hintStyle: TextStyle(fontSize: 13, color: Colors.white10),
                prefixIcon: Icon(LucideIcons.command, size: 12, color: Colors.white10),
                border: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(vertical: 10),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEusaiSection(String title, List<dynamic> items, IconData icon) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Text(title, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.5, color: Colors.white24)),
        ),
        ...items.map((item) => _buildEusaiItem(item, icon)).toList(),
        const SizedBox(height: 12),
      ],
    );
  }

  Widget _buildEusaiItem(dynamic item, IconData icon) {
    final bool isSelected = _selectedChannel != null && _selectedChannel['id'] == item['id'];
    
    return Container(
      margin: const EdgeInsets.only(bottom: 2, left: 8, right: 8),
      child: Material(
        color: isSelected ? AppTheme.eusaiBlue.withOpacity(0.1) : Colors.transparent,
        borderRadius: BorderRadius.circular(14),
        child: ListTile(
          dense: true,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          leading: Icon(icon, size: 16, color: isSelected ? AppTheme.eusaiBlue : Colors.white10),
          title: Text(_getChannelName(item), style: TextStyle(fontSize: 13, fontWeight: isSelected ? FontWeight.w900 : FontWeight.w600, color: isSelected ? Colors.white : Colors.white24)),
          onTap: () {
            setState(() { _selectedChannel = item; _currentView = 'CHAT'; });
            if (MediaQuery.of(context).size.width <= 900) {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => ChatScreen(
                    channel: item,
                    onNameIdentified: _getChannelName(item),
                  ),
                ),
              );
            }
          },
        ),
      ),
    );
  }

  Widget _buildCurrentUserTile() {
    final api = context.read<ApiService>();
    final String userName = api.currentUserName;
    final String userRole = api.currentUserRole;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: const Color(0xFF0D0D0D), border: Border(top: BorderSide(color: Colors.white.withOpacity(0.05)))),
      child: Row(
        children: [
          Container(
            width: 32, height: 32,
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(10)),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: api.currentUserImage != null 
                ? Image.network(api.currentUserImage!, fit: BoxFit.cover) 
                : Center(child: Text(userName.isNotEmpty ? userName[0] : '?', style: const TextStyle(color: Colors.white24, fontWeight: FontWeight.bold))),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(userName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)), Text(userRole.toUpperCase(), style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: AppTheme.eusaiNeon))])),
        ],
      ),
    );
  }
}

class _SyncIndicator extends StatefulWidget {
  const _SyncIndicator();
  @override
  State<_SyncIndicator> createState() => _SyncIndicatorState();
}

class _SyncIndicatorState extends State<_SyncIndicator> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(seconds: 1))..repeat(reverse: true);
  }
  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _controller,
      child: Container(
        width: 6, 
        height: 6, 
        decoration: const BoxDecoration(
          color: AppTheme.eusaiBlue, 
          shape: BoxShape.circle, 
          boxShadow: [BoxShadow(color: AppTheme.eusaiBlue, blurRadius: 4)]
        )
      ),
    );
  }
}
