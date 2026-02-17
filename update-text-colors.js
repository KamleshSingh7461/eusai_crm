// Script to update text colors to use Notion hierarchy
// Run with: node update-text-colors.js

const fs = require('fs');
const path = require('path');

// Define replacements
const replacements = [
    // Headings (h1, h2, h3, h4 with text-[#172B4D]) → text-heading
    {
        pattern: /(<h[1-4][^>]*className="[^"]*?)text-\[#172B4D\]/g,
        replacement: '$1text-heading'
    },

    // Subheadings and labels → text-subheading  
    {
        pattern: /text-\[#42526E\]/g,
        replacement: 'text-subheading'
    },

    // Body text and tertiary content → text-body
    {
        pattern: /text-\[#6B778C\]/g,
        replacement: 'text-body'
    },

    // Special case: #172B4D in non-heading contexts → text-subheading
    {
        pattern: /text-\[#172B4D\]/g,
        replacement: 'text-subheading'
    }
];

// Files to update
const dashboardFiles = [
    'src/components/dashboard/DirectorDashboard.tsx',
    'src/components/dashboard/EmployeeDashboard.tsx',
    'src/components/dashboard/ManagerDashboard.tsx',
    'src/components/dashboard/TeamLeaderDashboard.tsx',
    'src/components/dashboard/WorkspaceHealthWidget.tsx',
    'src/components/dashboard/WorkActivityFeed.tsx',
    'src/components/dashboard/TaskTracker.tsx',
    'src/components/dashboard/MilestoneTracker.tsx',
    'src/components/dashboard/IssuesTracker.tsx',
    'src/components/dashboard/PortfolioPulse.tsx',
    'src/components/dashboard/NewsFeed.tsx',
];

// Process files
dashboardFiles.forEach(file => {
    const filepath = path.join(__dirname, file);

    if (!fs.existsSync(filepath)) {
        console.log(`⚠️  Skipping ${file} (not found)`);
        return;
    }

    let content = fs.readFileSync(filepath, 'utf8');
    let changed = false;

    replacements.forEach(({ pattern, replacement }) => {
        const before = content;
        content = content.replace(pattern, replacement);
        if (content !== before) changed = true;
    });

    if (changed) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`✅ Updated ${file}`);
    } else {
        console.log(`⏭️  No changes needed in ${file}`);
    }
});

console.log('\n✨ Text hierarchy update complete!');
