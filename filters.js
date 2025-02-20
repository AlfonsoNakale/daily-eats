// Initialize filtering functionality using Finsweet CMS Filter
export function initializeFilters() {
  // Check if we have both filter elements and items to filter
  const filterForm = document.querySelector('[fs-cmsfilter-element="filters"]')
  const filterList = document.querySelector('[fs-cmsfilter-element="list"]')

  if (!filterForm || !filterList) {
    console.log('Required filter elements not found, skipping initialization')
    return
  }

  console.log('Initializing filters...')
  // 1. Get References to Elements
  const checkboxes = document.querySelectorAll('[fs-cmsfilter-field]')
  const cmsItems = document.querySelectorAll('.w-dyn-item')
  const itemTagsCache = new Map()

  console.log('Found elements:', {
    checkboxes: checkboxes.length,
    items: cmsItems.length,
  })

  // 2. Function to get selected tags grouped by category
  function getSelectedTagsByCategory() {
    const tagsByCategory = new Map()

    checkboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        const tag = checkbox.nextElementSibling.textContent.trim()
        const category =
          checkbox.closest('[fs-cmsfilter-element="filters"]')?.dataset
            .category || 'default'

        if (!tagsByCategory.has(category)) {
          tagsByCategory.set(category, new Set())
        }
        tagsByCategory.get(category).add(tag)
      }
    })

    console.log(
      'Selected tags by category:',
      Object.fromEntries(tagsByCategory)
    )
    return tagsByCategory
  }

  // 3. Function to get or create cached item tags
  function getItemTags(item) {
    if (itemTagsCache.has(item)) {
      return itemTagsCache.get(item)
    }

    const itemTagElements = item.querySelectorAll('[fs-cmsfilter-field="tags"]')
    const itemTags = Array.from(itemTagElements).map((el) =>
      el.textContent.trim()
    )

    itemTagsCache.set(item, itemTags)
    console.log('Found tags for item:', itemTags)
    return itemTags
  }

  // 4. Function to Filter Items
  function filterItems() {
    console.log('Filtering items...')
    const selectedTagsByCategory = getSelectedTagsByCategory()

    // If no filters are selected, show all items
    if (selectedTagsByCategory.size === 0) {
      console.log('No filters selected - showing all items')
      cmsItems.forEach((item) => {
        item.style.display = 'block'
      })
      return
    }

    // Filter items
    let visibleCount = 0
    cmsItems.forEach((item) => {
      const itemTags = getItemTags(item)

      // Check if the item matches ALL categories (AND between categories)
      const matchesAllCategories = Array.from(
        selectedTagsByCategory.entries()
      ).every(([, categoryTags]) => {
        // Check if the item matches ANY tag in this category (OR within category)
        const matches = Array.from(categoryTags).some((tag) =>
          itemTags.includes(tag)
        )
        return matches
      })

      // Show or hide the item based on the filter result
      item.style.display = matchesAllCategories ? 'block' : 'none'
      if (matchesAllCategories) visibleCount++
    })

    console.log(`Filtering complete: ${visibleCount} items visible`)
  }

  // 5. Clear filters function
  function clearFilters() {
    console.log('Clearing all filters')
    checkboxes.forEach((checkbox) => {
      checkbox.checked = false
    })
    filterItems()
  }

  // 6. Add clear filters button if it exists
  const clearFiltersBtn = document.querySelector('.clear-filters-button')
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', clearFilters)
    console.log('Clear filters button initialized')
  }

  // 7. Attach Event Listeners to Checkboxes
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', filterItems)
  })
  console.log('Event listeners attached to checkboxes')

  // 8. Initialize filters on page load
  filterItems()
}
