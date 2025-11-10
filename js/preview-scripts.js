window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('previewNewsletter');
  const container = document.getElementById('previewContainer');

  if (saved) {
    // Remove editor-only attributes/buttons
    let clean = saved
      .replaceAll('contenteditable="true"', '')
      .replaceAll('🗑', '')
      .replaceAll('<button class="remove-btn" onclick="removeElement(this)">🗑</button>', '')
      .replaceAll('<button class="add-btn" onclick="addMainArticle()">+ Add Article</button>', '')
      .replaceAll('<button class="add-btn" onclick="addSidePanel()">+ Add Panel</button>', '');

    container.innerHTML = clean;

    // Remove empty ledes
    container.querySelectorAll('.lede').forEach(lede => {
      if (!lede.textContent.trim()) {
        lede.remove();
      }
    });

    // Remove empty side panels
    container.querySelectorAll('.card-aside').forEach(panel => {
      if (!panel.textContent.trim()) {
        panel.remove();
      }
    });

  } else {
    container.innerHTML = '<p>No preview available.</p>';
  }
});