import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:emoji_picker_flutter/emoji_picker_flutter.dart';
import 'package:local_notifier/local_notifier.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:path_provider/path_provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class ChatScreen extends StatefulWidget {
  final dynamic channel;
  final bool isSplitView;
  final String? onNameIdentified;
  final bool isDetailsOpen;
  final VoidCallback? onToggleDetails;

  const ChatScreen({
    super.key, 
    required this.channel, 
    this.isSplitView = false,
    this.onNameIdentified,
    this.isDetailsOpen = false,
    this.onToggleDetails,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class MentionTextEditingController extends TextEditingController {
  @override
  TextSpan buildTextSpan({required BuildContext context, TextStyle? style, required bool withComposing}) {
    final List<TextSpan> children = [];
    final mentionRegex = RegExp(r'@\[([^\]]+)\]\(user:([a-zA-Z0-9-]+)\)');
    
    int lastMatchEnd = 0;
    final matches = mentionRegex.allMatches(text);

    for (final match in matches) {
      if (match.start > lastMatchEnd) {
        children.add(TextSpan(
          text: text.substring(lastMatchEnd, match.start),
          style: style?.copyWith(color: Colors.white, fontWeight: FontWeight.normal),
        ));
      }
      children.add(TextSpan(
        text: '@${match.group(1)}',
        style: style?.copyWith(color: AppTheme.eusaiBlue, fontWeight: FontWeight.w900),
      ));
      lastMatchEnd = match.end;
    }

    if (lastMatchEnd < text.length) {
      children.add(TextSpan(
        text: text.substring(lastMatchEnd),
        style: style?.copyWith(color: Colors.white, fontWeight: FontWeight.normal),
      ));
    }

    return TextSpan(children: children, style: style);
  }
}

class _ChatScreenState extends State<ChatScreen> {
  final MentionTextEditingController _controller = MentionTextEditingController();
  final ScrollController _scrollController = ScrollController();
  List<dynamic> _messages = [];
  List<dynamic> _users = [];
  List<dynamic> _filteredUsers = [];
  Timer? _timer;
  bool _isSending = false;
  String? _mentionQuery;
  bool _showEmoji = false;
  List<File> _selectedFiles = [];
  final FocusNode _focusNode = FocusNode();
  bool _isDownloading = false;
  String _downloadingName = '';

  @override
  void initState() {
    super.initState();
    _loadMessages();
    _loadUsers();
    _timer = Timer.periodic(const Duration(seconds: 3), (timer) => _loadMessages());
    _controller.addListener(_onTextChanged);
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.removeListener(_onTextChanged);
    _controller.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _onTextChanged() {
    final text = _controller.text;
    final selection = _controller.selection;
    if (selection.baseOffset <= 0) {
      if (_mentionQuery != null) setState(() => _mentionQuery = null);
      return;
    }

    final textBeforeCursor = text.substring(0, selection.baseOffset);
    final words = textBeforeCursor.split(RegExp(r'\s'));
    final lastWord = words.last;

    if (lastWord.startsWith('@')) {
      final query = lastWord.substring(1).toLowerCase();
      final filtered = _users.where((u) => (u['name'] ?? '').toString().toLowerCase().contains(query)).toList();
      setState(() {
        _mentionQuery = query;
        _filteredUsers = filtered;
      });
    } else {
      if (_mentionQuery != null) setState(() => _mentionQuery = null);
    }
  }

  Future<void> _loadUsers() async {
    final users = await context.read<ApiService>().fetchUsers();
    if (mounted) setState(() => _users = users);
  }

  Future<void> _loadMessages({bool forceScroll = false}) async {
    final api = context.read<ApiService>();
    final msgs = await api.fetchMessages(widget.channel['id']);
    if (mounted) {
      final bool wasAtBottom = _scrollController.hasClients && 
                               _scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 100;
      
      if (msgs.length > _messages.length && _messages.isNotEmpty) {
        final lastMsg = msgs.last;
        if (lastMsg['sender']['id'].toString() != api.currentUserId) {
          _showDesktopNotification(lastMsg);
        }
      }

      setState(() {
        _messages = msgs;
      });

      if (forceScroll || (wasAtBottom && _messages.isNotEmpty)) {
        Future.delayed(const Duration(milliseconds: 100), () {
          if (_scrollController.hasClients) {
            _scrollController.animateTo(
              _scrollController.position.maxScrollExtent,
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOut,
            );
          }
        });
      }
    }
  }

  void _showDesktopNotification(dynamic msg) {
    LocalNotification notification = LocalNotification(
      title: "New from ${msg['sender']['name']}",
      body: msg['content'] ?? "Sent an attachment",
    );
    notification.show();
  }

  Future<void> _pickFiles() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(allowMultiple: true);
    if (result != null) {
      setState(() {
        _selectedFiles.addAll(result.paths.map((path) => File(path!)).toList());
      });
    }
  }

  Future<void> _downloadAttachment(String url, String fileName) async {
    final api = context.read<ApiService>();
    
    setState(() {
      _isDownloading = true;
      _downloadingName = fileName;
    });

    final bytes = await api.downloadFile(url);
    
    if (mounted) setState(() => _isDownloading = false);

    if (bytes != null && bytes.isNotEmpty) {
      final dir = await getDownloadsDirectory();
      if (dir != null) {
        final filePath = '${dir.path}/$fileName';
        final file = File(filePath);
        await file.writeAsBytes(bytes);
        
        LocalNotification(
          title: "Extraction Complete", 
          body: "$fileName saved to Downloads.",
        ).show();

        final uri = Uri.file(filePath);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri);
        }
      }
    } else {
      LocalNotification(
        title: "Extraction Blocked", 
        body: "The server rejected the request for $fileName. Verify permissions.",
      ).show();
    }
  }

  Future<void> _sendMessage() async {
    if (_controller.text.trim().isEmpty && _selectedFiles.isEmpty) return;
    
    setState(() => _isSending = true);
    final content = _controller.text;
    _controller.clear();
    setState(() => _selectedFiles = []);

    final success = await context.read<ApiService>().sendMessage(widget.channel['id'], content);
    if (success) {
      _loadMessages(forceScroll: true);
    }
    
    if (mounted) setState(() => _isSending = false);
  }

  void _insertMention(dynamic user) {
    final text = _controller.text;
    final selection = _controller.selection;
    final textBeforeCursor = text.substring(0, selection.baseOffset);
    final words = textBeforeCursor.split(RegExp(r'\s'));
    words.removeLast();
    
    final mentionString = '@[${user['name']}](user:${user['id']}) ';
    final newTextBefore = words.join(' ') + (words.isEmpty ? '' : ' ') + mentionString;
    final newTextAfter = text.substring(selection.baseOffset).trimLeft();
    
    _controller.text = newTextBefore + newTextAfter;
    _controller.selection = TextSelection.collapsed(offset: newTextBefore.length);
    setState(() => _mentionQuery = null);
    _focusNode.requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.blackMain,
      body: SafeArea(
        child: Column(
          children: [
            _buildEusaiHeader(),
            Expanded(
              child: Stack(
                children: [
                  ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final msg = _messages[index];
                      return _buildEusaiMessage(msg);
                    },
                  ),
                  if (_mentionQuery != null && _filteredUsers.isNotEmpty) 
                    Positioned(
                      bottom: 0, left: 24, right: 24,
                      child: _buildMentionPicker(),
                    ),
                ],
              ),
            ),
            if (_selectedFiles.isNotEmpty) _buildFilePreview(),
            if (_isDownloading) _buildDownloadOverlay(),
            _buildEusaiInput(),
            if (_showEmoji) _buildEmojiPicker(),
          ],
        ),
      ),
    );
  }

  Widget _buildDownloadOverlay() {
    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      decoration: BoxDecoration(
        color: AppTheme.eusaiBlue.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.eusaiBlue.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          const SizedBox(
            width: 16, height: 16,
            child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.eusaiBlue),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              'EXTRACTING: $_downloadingName',
              style: const TextStyle(color: AppTheme.eusaiBlue, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilePreview() {
    return Container(
      height: 80,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: _selectedFiles.length,
        itemBuilder: (context, index) {
          return Container(
            margin: const EdgeInsets.only(right: 12),
            width: 80,
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
            child: Stack(
              children: [
                const Center(child: Icon(LucideIcons.file, color: Colors.white24)),
                Positioned(
                  top: 4, right: 4,
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedFiles.removeAt(index)),
                    child: const CircleAvatar(radius: 10, backgroundColor: Colors.red, child: Icon(Icons.close, size: 12, color: Colors.white)),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildMentionPicker() {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      constraints: const BoxConstraints(maxHeight: 200),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A1A),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.eusaiBlue.withOpacity(0.3)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.5), blurRadius: 20)],
      ),
      child: ListView.builder(
        shrinkWrap: true,
        itemCount: _filteredUsers.length,
        itemBuilder: (context, index) {
          final user = _filteredUsers[index];
          return ListTile(
            onTap: () => _insertMention(user),
            leading: Container(
              width: 32, height: 32,
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(8)),
              child: Center(child: Text(user['name'][0], style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold))),
            ),
            title: Text(user['name'], style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
            subtitle: Text(user['role'].toString().toUpperCase(), style: const TextStyle(fontSize: 9, color: Colors.white24)),
          );
        },
      ),
    );
  }

  Widget _buildEmojiPicker() {
    return SizedBox(
      height: 250,
      child: EmojiPicker(
        onEmojiSelected: (category, emoji) {
          _controller.text += emoji.emoji;
        },
        config: Config(
          emojiViewConfig: EmojiViewConfig(
            columns: 7,
            emojiSizeMax: 32 * (Platform.isIOS ? 1.30 : 1.0),
            verticalSpacing: 0,
            horizontalSpacing: 0,
            gridPadding: EdgeInsets.zero,
            backgroundColor: const Color(0xFF0A0A0A),
          ),
          categoryViewConfig: const CategoryViewConfig(
            indicatorColor: AppTheme.eusaiBlue,
            iconColorSelected: AppTheme.eusaiBlue,
            backspaceColor: AppTheme.eusaiBlue,
            backgroundColor: Color(0xFF0A0A0A),
          ),
          bottomActionBarConfig: const BottomActionBarConfig(
            backgroundColor: Color(0xFF0A0A0A),
            buttonColor: Color(0xFF0A0A0A),
            buttonIconColor: Colors.grey,
          ),
        ),
      ),
    );
  }

  Widget _buildEusaiHeader() {
    final bool isWide = MediaQuery.of(context).size.width > 900;
    
    return Container(
      height: isWide ? 72 : 64,
      padding: EdgeInsets.symmetric(horizontal: isWide ? 24 : 12),
      decoration: BoxDecoration(
        color: const Color(0xFF0A0A0A).withOpacity(0.5),
        border: Border(bottom: BorderSide(color: Colors.white.withOpacity(0.05))),
      ),
      child: Row(
        children: [
          if (!widget.isSplitView)
            IconButton(
              icon: const Icon(LucideIcons.chevronLeft, size: 20), 
              onPressed: () => Navigator.pop(context),
              padding: EdgeInsets.zero,
            ),
          Container(
            width: isWide ? 36 : 32, 
            height: isWide ? 36 : 32,
            decoration: BoxDecoration(
              color: AppTheme.eusaiBlue.withOpacity(0.05),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTheme.eusaiBlue.withOpacity(0.1)),
            ),
            child: Icon(LucideIcons.hash, size: isWide ? 16 : 14, color: AppTheme.eusaiBlue),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.onNameIdentified ?? widget.channel['name'] ?? 'Transmission', 
                  style: TextStyle(fontSize: isWide ? 15 : 13, fontWeight: FontWeight.w900), 
                  overflow: TextOverflow.ellipsis
                ),
                Text(
                  'Secure communication.', 
                  style: TextStyle(fontSize: isWide ? 10 : 9, color: Colors.white24)
                ),
              ],
            ),
          ),
          if (isWide) ...[
            _buildInfoToggle(),
            const SizedBox(width: 24),
            Row(
              children: [
                Container(width: 6, height: 6, decoration: const BoxDecoration(color: Colors.green, shape: BoxShape.circle)),
                const SizedBox(width: 8),
                const Text('ENCRYPTED', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.green, letterSpacing: 1)),
              ],
            ),
          ] else
            IconButton(
              icon: const Icon(LucideIcons.info, size: 18, color: Colors.white24),
              onPressed: () {
                 // Show details in a modal bottom sheet on mobile
                 _showMobileDetails();
              },
            ),
        ],
      ),
    );
  }

  Widget _buildInfoToggle() {
    return IconButton(
      icon: Icon(
        LucideIcons.info,
        size: 18,
        color: widget.isDetailsOpen ? AppTheme.eusaiBlue : Colors.white24,
      ),
      onPressed: widget.onToggleDetails,
      tooltip: 'Tactical Details',
    );
  }

  void _showMobileDetails() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF0D0D0D),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('COMMUNICATION DETAILS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 2, color: Colors.white24)),
            const SizedBox(height: 24),
            // We could add more details here similar to the details panel
            Text('Channel: ${widget.channel['name']}', style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            const Text('Encryption: AES-256 GCM', style: TextStyle(fontSize: 10, color: Colors.green)),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildEusaiMessage(dynamic msg) {
    final api = context.read<ApiService>();
    final String myId = api.currentUserId ?? '';
    final String myEmail = api.currentUserEmail;
    
    final dynamic sender = msg['sender'];
    final String senderId = (sender is String) ? sender : (sender['id']?.toString() ?? '');
    final String senderEmail = (sender is Map) ? (sender['email']?.toString() ?? '') : '';
    
    final bool isMe = (senderId == myId && myId.isNotEmpty) || 
                     (senderEmail == myEmail && myEmail.isNotEmpty);
    
    final bool isWide = MediaQuery.of(context).size.width > 900;
    
    // Debug Strike: Log ID and Email comparison for alignment verification
    if (msg == _messages.last) {
      debugPrint('ALIGNMENT_PULSE: Sender[$senderId / $senderEmail] vs Me[$myId / $myEmail] -> isMe: $isMe');
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Row(
        mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isMe) _buildMessageAvatar(msg),
          const SizedBox(width: 12),
          Flexible(
            child: Column(
              crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                Container(
                  constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * (isWide ? 0.6 : 0.8)),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: isMe ? AppTheme.eusaiBlue : AppTheme.blackBubble,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (msg['content'] != null && msg['content'].toString().isNotEmpty)
                        _buildRichText(msg['content'] ?? '', isMe),
                      if (msg['attachments'] != null && (msg['attachments'] as List).isNotEmpty)
                        _buildAttachments(msg['attachments']),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 6, left: 4, right: 4),
                  child: Text(_formatTime(msg['createdAt']), style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.white10)),
                ),
              ],
            ),
          ),
          if (isMe) const SizedBox(width: 12),
          if (isMe) _buildMessageAvatar(msg),
        ],
      ),
    );
  }

  Widget _buildAttachments(dynamic attachments) {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: (attachments as List).map((att) {
          String url = att['url'] ?? '';
          final String type = att['fileType'] ?? att['type'] ?? '';
          final String name = att['name'] ?? 'Attachment';
          
          // Prepend baseUrl if relative
          if (url.startsWith('/')) {
            url = ApiService.baseUrl.replaceAll('/api', '') + url;
          }
          
          if (type.startsWith('image/')) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(
                  url,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => _buildFileAttachment({ 'url': url, 'name': name }),
                ),
              ),
            );
          }
          return _buildFileAttachment({ 'url': url, 'name': name });
        }).toList(),
      ),
    );
  }

  Widget _buildFileAttachment(dynamic att) {
    final String url = att['url'] ?? '';
    final String name = att['name'] ?? 'Attachment';
    return GestureDetector(
      onTap: () => _downloadAttachment(url, name),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        width: double.infinity,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withOpacity(0.1)),
        ),
        child: Row(
          children: [
            const Icon(LucideIcons.file, size: 16, color: Colors.white24),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                name,
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 8),
            const Icon(LucideIcons.download, size: 14, color: AppTheme.eusaiBlue),
          ],
        ),
      ),
    );
  }

  String _formatTime(String? dateStr) {
    if (dateStr == null) return '01:55 AM';
    try {
      final dt = DateTime.parse(dateStr).toLocal();
      final hour = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
      final min = dt.minute.toString().padLeft(2, '0');
      final ampm = dt.hour >= 12 ? 'PM' : 'AM';
      return '$hour:$min $ampm';
    } catch (e) { return '01:55 AM'; }
  }

  Widget _buildMessageAvatar(dynamic msg) {
    final sender = msg['sender'];
    final bool isString = sender is String;
    final String? imageUrl = isString ? null : sender['image'];
    final String name = isString ? 'Agent' : (sender['name'] ?? 'Unknown');

    return Container(
      width: 36, height: 36,
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(10)),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: imageUrl != null 
          ? Image.network(imageUrl, fit: BoxFit.cover, errorBuilder: (_, __, ___) => _buildInitials(name)) 
          : _buildInitials(name),
      ),
    );
  }

  Widget _buildInitials(String? name) {
    return Center(child: Text(name?[0] ?? '?', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white24)));
  }

  Widget _buildRichText(String content, bool isMe) {
    List<InlineSpan> spans = [];
    final mentionRegex = RegExp(r'@\[([^\]]+)\]\(user:([a-zA-Z0-9-]+)\)');
    int lastMatchEnd = 0;
    final matches = mentionRegex.allMatches(content);
    for (final match in matches) {
      if (match.start > lastMatchEnd) _addFormattedText(spans, content.substring(lastMatchEnd, match.start), isMe);
      final name = match.group(1);
      spans.add(WidgetSpan(
        alignment: PlaceholderAlignment.middle,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(color: isMe ? Colors.white.withOpacity(0.2) : AppTheme.eusaiBlue.withOpacity(0.2), borderRadius: BorderRadius.circular(4)),
          child: Text('@$name', style: TextStyle(color: isMe ? Colors.white : AppTheme.eusaiBlue, fontSize: 11, fontWeight: FontWeight.w900)),
        ),
      ));
      spans.add(const TextSpan(text: ' '));
      lastMatchEnd = match.end;
    }
    if (lastMatchEnd < content.length) _addFormattedText(spans, content.substring(lastMatchEnd), isMe);
    return RichText(text: TextSpan(style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.5, fontFamily: 'Inter'), children: spans));
  }

  void _addFormattedText(List<InlineSpan> spans, String text, bool isMe) {
    final formatRegex = RegExp(r'(\*\*.*?\*\*|\*.*?\*|`.*?`)');
    final parts = text.split(formatRegex);
    final matches = formatRegex.allMatches(text).toList();
    for (int i = 0; i < parts.length; i++) {
      if (parts[i].isNotEmpty) spans.add(TextSpan(text: parts[i]));
      if (i < matches.length) {
        final matchText = matches[i].group(0)!;
        if (matchText.startsWith('**')) spans.add(TextSpan(text: matchText.substring(2, matchText.length - 2), style: const TextStyle(fontWeight: FontWeight.w900)));
        else if (matchText.startsWith('*')) spans.add(TextSpan(text: matchText.substring(1, matchText.length - 1), style: const TextStyle(fontStyle: FontStyle.italic)));
        else if (matchText.startsWith('`')) spans.add(TextSpan(text: matchText.substring(1, matchText.length - 1), style: TextStyle(fontFamily: 'monospace', fontSize: 11, backgroundColor: isMe ? Colors.white.withOpacity(0.1) : Colors.black.withOpacity(0.3))));
      }
    }
  }

  Widget _buildEusaiInput() {
    final bool isWide = MediaQuery.of(context).size.width > 900;
    return Container(
      padding: EdgeInsets.fromLTRB(isWide ? 24 : 12, 0, isWide ? 24 : 12, isWide ? 32 : 16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFF111111), 
          borderRadius: BorderRadius.circular(24), 
          border: Border.all(color: Colors.white.withOpacity(0.05))
        ),
        child: Column(
          children: [
            TextField(
              controller: _controller,
              focusNode: _focusNode,
              maxLines: null,
              keyboardType: TextInputType.multiline,
              textInputAction: TextInputAction.newline,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: const InputDecoration(
                hintText: 'Enter command...', 
                hintStyle: TextStyle(color: Colors.white10, fontSize: 13), 
                border: InputBorder.none,
                isDense: true,
              ),
              onSubmitted: (_) => _sendMessage(),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                IconButton(icon: const Icon(LucideIcons.paperclip, size: 16, color: Colors.white24), onPressed: _pickFiles),
                IconButton(icon: const Icon(LucideIcons.smile, size: 16, color: Colors.white24), onPressed: () => setState(() => _showEmoji = !_showEmoji)),
                const Spacer(),
                GestureDetector(
                  onTap: _isSending ? null : _sendMessage,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppTheme.eusaiBlue.withOpacity(0.2), 
                      borderRadius: BorderRadius.circular(12), 
                      border: Border.all(color: AppTheme.eusaiBlue.withOpacity(0.3))
                    ),
                    child: Row(
                      children: [
                        if (_isSending) 
                          const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.eusaiBlue)) 
                        else 
                          const Icon(LucideIcons.send, size: 12, color: AppTheme.eusaiBlue),
                        const SizedBox(width: 8),
                        const Text('TRANSMIT', style: TextStyle(color: AppTheme.eusaiBlue, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
