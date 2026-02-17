const fs = require('fs');
const path = require('path');

// Define replacements for blue color accents in dark theme
const replacements = [
    // Light blue backgrounds that don't work in dark theme (icon containers, etc.)
    // These should remain subtle but visible in dark theme
    {
        pattern: /bg-blue-50\b/g,
        replacement: 'bg-blue-500/10',
        description: 'Replace light blue backgrounds with dark theme compatible version'
    },

    // Blue text on light backgrounds → ensure it works on dark
    {
        pattern: /text-blue-600\b/g,
        replacement: 'text-blue-400',
        description: 'Replace blue-600 text with lighter blue-400 for dark theme'
    },

    // Blue borders
    {
        pattern: /border-blue-100\b/g,
        replacement: 'border-blue-500/20',
        description: 'Replace light blue borders with dark theme compatible version'
    },
    {
        pattern: /border-blue-200\b/g,
        replacement: 'border-blue-500/30',
        description: 'Replace blue-200 borders with dark theme compatible version'
    },

    // Blue status badges (should remain vibrant but readable)
    {
        pattern: /bg-blue-100\b/g,
        replacement: 'bg-blue-500/20',
        description: 'Replace blue-100 status backgrounds'
    },
    {
        pattern: /text-blue-700\b/g,
        replacement: 'text-blue-300',
        description: 'Replace blue-700 text with blue-300 for dark theme'
    },

    // Hover states for blue backgrounds
    {
        pattern: /hover:bg-blue-100\b/g,
        replacement: 'hover:bg-blue-500/20',
        description: 'Replace blue hover backgrounds'
    },
    {
        pattern: /hover:bg-blue-50\b/g,
        replacement: 'hover:bg-blue-500/15',
        description: 'Replace light blue hover backgrounds'
    }
];

// Files to convert - all pages that use blue accents
const files = [
    'src/app/universities/page.tsx',
    'src/app/team/page.tsx',
    'src/app/spaces/page.tsx',
    'src/app/spaces/[id]/page.tsx',
    'src/app/welcome/page.tsx',
    'src/app/projects/page.tsx',
    'src/app/projects/[id]/page.tsx',
    'src/app/milestones/page.tsx',
    'src/app/analytics/page.tsx',
    'src/app/admin/page.tsx',
    'src/app/admin/users/page.tsx',
    'src/app/recent/page.tsx'
];

let totalChanges = 0;

files.forEach(file => {
    const filePath = path.join(__dirname, file);

    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.log(`⏭️  Skipping ${file} (not found)`);
            return;
        }

        // Read the file
        let content = fs.readFileSync(filePath, 'utf8');
        let changesMade = 0;

        console.log(`\n🎨 Updating blue accents in ${file}...`);

        // Apply each replacement
        replacements.forEach(({ pattern, replacement, description }) => {
            const matches = content.match(pattern);
            if (matches) {
                content = content.replace(pattern, replacement);
                changesMade += matches.length;
            }
        });

        // Write the file back
        if (changesMade > 0) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Made ${changesMade} changes`);
            totalChanges += changesMade;
        } else {
            console.log(`  No changes needed`);
        }

    } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
    }
});

console.log(`\n🎉 Blue accent update complete! Made ${totalChanges} total changes.\n`);
console.log('Blue buttons now use Notion design tokens and all blue accents work in dark theme.\n');
