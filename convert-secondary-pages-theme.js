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
    {
        pattern: /hover:bg-\[#FAFBFC\]/g,
        replacement: 'hover:bg-[var(--notion-bg-hover)]',
        description: 'Replace lighter hover backgrounds (variant)'
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

// Files to convert (Phase 2 - Secondary pages)
const files = [
    'src/app/spaces/page.tsx',
    'src/app/spaces/[id]/page.tsx',
    'src/app/welcome/page.tsx',
    'src/app/resources/page.tsx'
];

let totalChanges = 0;

files.forEach(file => {
    const filePath = path.join(__dirname, file);

    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.log(`⏭️  Skipping ${file} (not found)\n`);
            return;
        }

        // Read the file
        let content = fs.readFileSync(filePath, 'utf8');
        let changesMade = 0;

        console.log(`\n🎨 Converting ${file} to dark theme...`);

        // Apply each replacement
        replacements.forEach(({ pattern, replacement, description }) => {
            const matches = content.match(pattern);
            if (matches) {
                content = content.replace(pattern, replacement);
                changesMade += matches.length;
            }
        });

        // Write the file back
        fs.writeFileSync(filePath, content, 'utf8');

        console.log(`✅ Made ${changesMade} changes to ${file}`);
        totalChanges += changesMade;

    } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
    }
});

console.log(`\n🎉 Phase 2 Complete! Made ${totalChanges} total changes across ${files.length} files.\n`);
console.log('NOTE: Colorful elements (badges, icons, status indicators) were preserved.\n');
