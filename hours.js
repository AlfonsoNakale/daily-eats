// Time zone configuration (can be changed as needed)
const TIMEZONEINNER = 'Africa/Windhoek' // Example: Use your desired timezone

// Get current date and time information in the specified timezone
const todayInner = new Date(
  new Date().toLocaleString('en-US', { timeZone: TIMEZONEINNER })
)

// Array to map numeric day (0-6) to day names
// Note: JavaScript's getDay() returns 0 for Sunday, so we keep this order
const daysOfWeekInner = [
  'Sunday', // 0
  'Monday', // 1
  'Tuesday', // 2
  'Wednesday', // 3
  'Thursday', // 4
  'Friday', // 5
  'Saturday', // 6
]

// Get current day, hour, and minute in the specified timezone
const currentDayInner = daysOfWeekInner[todayInner.getDay()]
const currentHourInner = todayInner.getHours()
const currentMinuteInner = todayInner.getMinutes()

/**
 * Gets the operating hours for a specific day from the table
 * @param {HTMLElement} table - The operating hours table element
 * @param {string} day - The day to get hours for
 * @returns {string} Operating hours for that day
 */
function getHoursForDay(table, day) {
  if (!table) {
    console.warn('Opening hours table not found')
    return 'Closed'
  }
  const rows = table.getElementsByTagName('tr')

  for (let row of rows) {
    const dayCell = row.cells[0]
    const hoursCell = row.cells[1]
    if (dayCell.textContent.trim() === day) {
      return hoursCell.textContent.trim()
    }
  }

  return 'Closed' // Default to closed if day not found
}

/**
 * Converts 12-hour time format to minutes since midnight
 * @param {string} timeStr - Hour in format "H:MM" or "HH:MM"
 * @param {string} period - Either 'am' or 'pm'
 * @returns {number} Minutes since midnight
 */
function convertToMinutes(timeStr, period) {
  const [hours, minutes] = timeStr.split(':').map((num) => parseInt(num))
  let hour24 = hours

  // Convert to 24-hour format
  if (period.toLowerCase() === 'pm' && hours !== 12) {
    hour24 += 12
  } else if (period.toLowerCase() === 'am' && hours === 12) {
    hour24 = 0
  }

  return hour24 * 60 + minutes
}

/**
 * Determines if the business is currently open based on hours string
 * @param {string} hours - Opening hours in format "H:MM am/pm - H:MM am/pm" or "Closed"
 * @returns {boolean} Whether the business is currently open
 */
function isOpen(hours) {
  // If the business is closed for the day, return false
  if (hours === 'Closed') return false

  // Split the hours string into opening and closing times
  const [openTime, closeTime] = hours.split('-').map((time) => time.trim())
  const [openTimeStr, openPeriod] = openTime
    .split(' ')
    .filter((part) => part !== '')
  const [closeTimeStr, closePeriod] = closeTime
    .split(' ')
    .filter((part) => part !== '')

  // Convert all times to minutes since midnight
  const openMinutes = convertToMinutes(openTimeStr, openPeriod)
  const closeMinutes = convertToMinutes(closeTimeStr, closePeriod)
  const currentMinutes = currentHourInner * 60 + currentMinuteInner

  // Check if current time falls within opening hours
  if (closeMinutes > openMinutes) {
    // Normal case (e.g., 9:00 am - 7:00 pm)
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes
  } else {
    // Overnight case (e.g., 9:00 am - 2:00 am)
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes
  }
}

/**
 * Updates the operating status for all collection items
 */
function updateAllOperatingStatuses() {
  // Get all collection items
  const collectionItems = document.querySelectorAll('.w-dyn-item')

  collectionItems.forEach((item) => {
    // Get the operating hours table and status element for this item
    const table = item.querySelector('#opening-hours')
    const statusElement = item.querySelector('#operatingListingStatus')

    if (table && statusElement) {
      const todayHours = getHoursForDay(table, currentDayInner)
      const isCurrentlyOpen = isOpen(todayHours)

      // Update the status text and color
      statusElement.textContent = isCurrentlyOpen ? '• Open' : '• Closed'
      statusElement.style.color = isCurrentlyOpen ? '#16c47f' : '#f93827'

      // Update the hours display in the table
      const currentDayRow = Array.from(table.getElementsByTagName('tr')).find(
        (row) => row.cells[0].textContent.trim() === currentDayInner
      )

      if (currentDayRow) {
        const hoursCell = currentDayRow.cells[1]
        // Only add the status if it's not already there
        if (!hoursCell.textContent.includes('•')) {
          hoursCell.innerHTML += `<span style="color: ${
            isCurrentlyOpen ? '#16c47f' : '#f93827'
          }"> • ${isCurrentlyOpen ? 'Open' : 'Closed'}</span>`
        }
      }
    }
  })
}

// Initial update
updateAllOperatingStatuses()

// Update every minute
setInterval(updateAllOperatingStatuses, 60000)
