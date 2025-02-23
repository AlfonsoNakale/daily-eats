console.log('Filters.js script loaded!')

// Initialize filtering functionality using Finsweet CMS Filter
export function initializeFilters() {
  // Check if we have both filter elements and items to filter
  const filterForm = document.querySelector('[fs-cmsfilter-element="filters"]')
  const filterList = document.querySelector('[fs-cmsfilter-element="list"]')

  console.log('Filter elements found:', {
    filterForm: filterForm ? 'Found' : 'Not found',
    filterList: filterList ? 'Found' : 'Not found',
  })

  if (!filterForm || !filterList) {
    console.log('Required filter elements not found, skipping initialization')
    console.log('Make sure you have elements with these attributes:')
    console.log(
      '1. fs-cmsfilter-element="filters" on your form/filter container'
    )
    console.log(
      '2. fs-cmsfilter-element="list" on your collection list wrapper'
    )
    return
  }

  console.log('Initializing filters...')
  // 1. Get References to Elements
  const checkboxes = document.querySelectorAll('input[type="checkbox"]')
  const cmsItems = document.querySelectorAll('.location-map_card-wrap')
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
        // Get the label text which contains the tag name
        const tag = checkbox.parentElement
          ?.querySelector('.w-form-label')
          ?.textContent?.trim()
        // Get category from the closest heading
        const category =
          checkbox
            .closest('div')
            ?.previousElementSibling?.textContent?.trim() || 'default'

        if (tag) {
          if (!tagsByCategory.has(category)) {
            tagsByCategory.set(category, new Set())
          }
          tagsByCategory.get(category).add(tag)
          console.log(`Added tag "${tag}" to category "${category}"`)
        }
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

    const itemTags = []

    // Get all checkbox labels within the item
    const tagLabels = item.querySelectorAll('.w-form-label')
    tagLabels.forEach((label) => {
      const tag = label.textContent.trim()
      if (tag) itemTags.push(tag)
    })

    // Get listing type
    const listingType = item.querySelector('.contact-text')?.textContent?.trim()
    if (listingType) itemTags.push(listingType)

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
        item.style.display = ''
      })
      return
    }

    // Filter items
    let visibleCount = 0
    cmsItems.forEach((item) => {
      const itemTags = getItemTags(item)
      console.log('Checking item tags:', itemTags)

      // Check if the item matches ALL categories (AND between categories)
      const matchesAllCategories = Array.from(
        selectedTagsByCategory.entries()
      ).every(([category, categoryTags]) => {
        // Check if the item matches ANY tag in this category (OR within category)
        const matches = Array.from(categoryTags).some((tag) => {
          const hasMatch = itemTags.some(
            (itemTag) => itemTag.toLowerCase() === tag.toLowerCase()
          )
          console.log(`Checking if item has tag "${tag}": ${hasMatch}`)
          return hasMatch
        })
        console.log(`Category "${category}" matches: ${matches}`)
        return matches
      })

      // Show or hide the item based on the filter result
      item.style.display = matchesAllCategories ? '' : 'none'
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
