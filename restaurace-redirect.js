// Redirect old restaurant pages to new dynamic detail page
// This script handles URLs like: restaurace-[slug].html -> restaurace-detail.html?id=[slug]

(function() {
  const currentPath = window.location.pathname;
  const fileName = currentPath.split('/').pop();
  
  // Check if this is a restaurant detail page (restaurace-*.html but not restaurace-detail.html)
  if (fileName.startsWith('restaurace-') && fileName.endsWith('.html') && fileName !== 'restaurace-detail.html' && fileName !== 'restaurace.html') {
    // Extract slug from filename: restaurace-[slug].html -> [slug]
    const slug = fileName.replace('restaurace-', '').replace('.html', '');
    
    // Redirect to dynamic detail page
    const newUrl = `restaurace-detail.html?id=${slug}`;
    window.location.replace(newUrl);
  }
})();
