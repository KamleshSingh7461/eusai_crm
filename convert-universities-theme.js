const fs = require('fs');
const path = require('path');

// Define replacements for dark theme conversion
const replacements = [
    // White backgrounds → Dark primary background
    {
        pattern: /bg-white\b/g,
        replacement: 'bg-[var(--notion-bg-primary)]',
        description: 'Replace bg-white with dark primary background'
    },

    // Light backgrounds → Dark secondary/tertiary backgrounds
    {
        pattern: /bg-\[#FAFBFC\]/g,
        replacement: 'bg-[var(--notion-bg-secondary)]',
        description: 'Replace light gray backgrounds with dark secondary'
    },
    {
        pattern: /bg-\[#EBECF0\]/g,
        replacement: 'bg-[var(--notion-bg-tertiary)]',
        description: 'Replace lighter gray backgrounds with dark tertiary'
    },

    // Borders → Dark theme borders
    {
        pattern: /border-\[#DFE1E6\]/g,
        replacement: 'border-[var(--notion-border-default)]',
        description: 'Replace light borders with dark borders'
    },

    // Hover backgrounds
    {
        pattern: /hover:bg-\[#EBECF0\]/g,
        replacement: 'hover:bg-[var(--notion-bg-hover)]',
        description: 'Replace light hover backgrounds'
    },
    {
        pattern: /hover:bg-\[#F4F5F7\]/g,
        replacement: 'hover:bg-[var(--notion-bg-hover)]',
        description: 'Replace lighter hover backgrounds'
    },

    // Text colors (use utility classes where possible)
    {
        pattern: /text-\[#172B4D\]/g,
        replacement: 'text-heading',
        description: 'Replace dark text with heading utility'
    },
    {
        pattern: /text-\[#42526E\]/g,
        replacement: 'text-subheading',
        description: 'Replace medium text with subheading utility'
    },
    {
        pattern: /text-\[#6B778C\]/g,
        replacement: 'text-body',
        description: 'Replace light text with body utility'
    },
    {
        pattern: /text-\[#5E6C84\]/g,
        replacement: 'text-body',
        description: 'Replace gray text with body utility'
    }
];

// File to convert
const filePath = path.join(__dirname, 'src', 'app', 'universities', 'page.tsx');

try {
    // Read the file
    let content = fs.readFileSync(filePath, 'utf8');
    let changesMade = 0;

    console.log('\n🎨 Converting universities page to dark theme...\n');

    // Apply each replacement
    replacements.forEach(({ pattern, replacement, description }) => {
        const matches = content.match(pattern);
        if (matches) {
            console.log(`✓ ${description}: ${matches.length} replacements`);
            content = content.replace(pattern, replacement);
            changesMade += matches.length;
        }
    });

    // Write the file back
    fs.writeFileSync(filePath, content, 'utf8');

    console.log(`\n✅ Conversion complete! Made ${changesMade} changes to universities/page.tsx\n`);
    console.log('NOTE: Colorful elements (badges, icons, status indicators) were preserved.\n');

} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
