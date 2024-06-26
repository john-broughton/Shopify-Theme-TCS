// This is the javascript entrypoint for the countdown section.
// This file and all its inclusions will be processed through esbuild

/*============================================================================
  CountdownTimer
==============================================================================*/

class CountdownTimer extends HTMLElement {
  constructor() {
    super()
    this.el = this
    this.display = this.querySelector('[data-time-display]')
    this.block = this.closest('.countdown__block--timer')
    this.year = this.el.dataset.year
    this.month = this.el.dataset.month
    this.day = this.el.dataset.day
    this.hour = this.el.dataset.hour
    this.minute = this.el.dataset.minute
    this.daysPlaceholder = this.querySelector('[date-days-placeholder]')
    this.hoursPlaceholder = this.querySelector('[date-hours-placeholder]')
    this.minutesPlaceholder = this.querySelector('[date-minutes-placeholder]')
    this.secondsPlaceholder = this.querySelector('[date-seconds-placeholder]')
    this.messagePlaceholder = this.querySelector('[data-message-placeholder]')
    this.hideTimerOnComplete = this.el.dataset.hideTimer
    this.completeMessage = this.el.dataset.completeMessage

    this.timerComplete = false

    this.init()
  }

  init() {
    setInterval(() => {
      if (!this.timerComplete) {
        this._calculate()
      }
    }, 1000)
  }

  _calculate() {
    // Find time difference and convert to integer
    const timeDifference =
      +new Date(`${this.month}/${this.day}/${this.year} ${this.hour}:${this.minute}:00`).getTime() -
      +new Date().getTime()
    // If time difference is greater than 0, calculate remaining time
    if (timeDifference > 0) {
      const intervals = {
        days: Math.floor(timeDifference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((timeDifference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((timeDifference / 1000 / 60) % 60),
        seconds: Math.floor((timeDifference / 1000) % 60)
      }

      this.daysPlaceholder.innerHTML = intervals.days
      this.hoursPlaceholder.innerHTML = intervals.hours
      this.minutesPlaceholder.innerHTML = intervals.minutes
      this.secondsPlaceholder.innerHTML = intervals.seconds

      setTimeout(() => {
        this.display.classList.add('countdown__display--loaded')
      }, 1)
    } else {
      if (this.completeMessage && this.messagePlaceholder) {
        this.messagePlaceholder.classList.add('countdown__timer-message--visible')
      }

      if (this.hideTimerOnComplete === 'true') {
        this.display.classList.remove('countdown__display--visible')
        this.display.classList.add('countdown__display--hidden')
      }

      if (!this.completeMessage && this.hideTimerOnComplete === 'true') {
        this.block.classList.add('countdown__block--hidden')
      }

      this.timerComplete = true
    }
  }
}

customElements.define('countdown-timer', CountdownTimer)
