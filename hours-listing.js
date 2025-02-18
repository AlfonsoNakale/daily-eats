// Time zone configuration (can be changed as needed)
const TIMEZONE = 'Africa/Windhoek' // Example: Use your desired timezone

// Get current date and time information in the specified timezone
const today = new Date(
  new Date().toLocaleString('en-US', { timeZone: TIMEZONE })
)

// Array to map numeric day (0-6) to day names
// Note: JavaScript's getDay() returns 0 for Sunday, so we keep this order
const daysOfWeek = [
  'Sunday', // 0
  'Monday', // 1
  'Tuesday', // 2
  'Wednesday', // 3
  'Thursday', // 4
  'Friday', // 5
  'Saturday', // 6
]

// Get current day, hour, and minute in the specified timezone
const currentDay = daysOfWeek[today.getDay()]
const currentHour = today.getHours()
const currentMinute = today.getMinutes()

/**
 * Gets the operating hours for a specific day from the table
 * @param {string} day - The day to get hours for
 * @returns {string} Operating hours for that day
 */
function getHoursForDay(day) {
  const table = document.getElementById('opening-hours')
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
  const currentMinutes = currentHour * 60 + currentMinute

  // Check if current time falls within opening hours
  if (closeMinutes > openMinutes) {
    // Normal case (e.g., 9:00 am - 7:00 pm)
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes
  } else {
    // Overnight case (e.g., 9:00 am - 2:00 am)
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes
  }
}

// Get all rows from the opening hours table
const tableRows = document.querySelectorAll('#opening-hours tr')

// Get the operating status element
const operatingStatus = document.getElementById(
  'operating_status',
  'operating_status_home'
)

// Update each row in the table
tableRows.forEach((row) => {
  const dayCell = row.cells[0] // First cell contains day name
  const hoursCell = row.cells[1] // Second cell contains hours

  // If this row represents the current day
  if (dayCell.textContent === currentDay) {
    dayCell.classList.add('current-day') // Highlight current day

    const todayHours = getHoursForDay(currentDay)
    const isCurrentlyOpen = isOpen(todayHours)
    //const statusText = isCurrentlyOpen ? ' • Open' : ' • Closed'
    const statusColor = isCurrentlyOpen ? '#16c47f' : '#f93827'

    // Add open/closed status to hours display with color
    //hoursCell.innerHTML += `<span style="color: ${statusColor}">${statusText}</span>`

    // Update the operating status text block
    if (operatingStatus) {
      operatingStatus.textContent = isCurrentlyOpen ? '• Open' : '• Closed'
      operatingStatus.style.color = statusColor
    }

    // Add appropriate CSS class based on open/closed status
    hoursCell.classList.add(isCurrentlyOpen ? 'open' : 'closed')
  }
})
