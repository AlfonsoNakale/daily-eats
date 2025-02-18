// Initialize filtering functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  // 1. Get References to Elements
  const checkboxes = document.querySelectorAll('.filter-checkbox')
  const cmsItems = document.querySelectorAll('.w-dyn-item')

  // 2. Function to Filter Items
  function filterItems() {
    const selectedTags = []

    // Get the checked checkboxes and their associated tags
    checkboxes.forEach((checkbox) => {
      if (checkbox.checked && checkbox.dataset && checkbox.dataset.tag) {
        selectedTags.push(checkbox.dataset.tag.trim())
      }
    })

    // Loop through each CMS item and check if it matches the filter criteria
    cmsItems.forEach((item) => {
      const itemTagsElement = item.querySelector('.item-tags')
      let itemTags = [] // Initialize itemTags

      if (
        itemTagsElement &&
        itemTagsElement.dataset &&
        itemTagsElement.dataset.tags
      ) {
        const tagsString = itemTagsElement.dataset.tags
        itemTags = tagsString.split(',').map((tag) => tag.trim())
      }

      // Default to showing the item if no tags are selected
      let shouldShow = selectedTags.length === 0

      if (!shouldShow) {
        // Check if *all* selected tags are present in the item's tags
        shouldShow = selectedTags.every((tag) => itemTags.includes(tag))
      }

      // Show or hide the item based on the filter result
      item.style.display = shouldShow ? 'block' : 'none'
    })
  }

  // 3. Attach Event Listeners to Checkboxes
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', filterItems)
  })
})
