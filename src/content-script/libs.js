// In order to retrieve email data, gmail-js needs to be injected on the body

// eslint-disable-next-line
const GmailFactory = require('gmail-js')
// eslint-disable-next-line
const jQuery = require('jquery')

function cleanEmailBody(html) {
  const newElem = document.createElement('div')
  newElem.innerHTML = html.replaceAll('<div><br></div>', '__NEWLNE__')
  const quotes = newElem.getElementsByClassName('gmail_quote')
  while (quotes.length > 0) {
    quotes[0].parentNode?.removeChild(quotes[0])
  }

  const body = newElem.textContent?.replaceAll('__NEWLNE__', `\n`) || ''
  return body.replaceAll(`"`, `'`).trim()
}

function getLoggedName() {
  const email = gmail.get.user_email()

  const loggedUser = gmail.get.loggedin_accounts().find((data) => data.email === email)

  return loggedUser?.name || email
}

function emailToName(email) {
  const elem = document.querySelector(`span[email="${email}"]`)
  return elem.textContent || email
}

function handleDomEmail() {
  setTimeout(() => {
    const tdata = gmail.new.get.thread_data()

    let response = { author: getLoggedName() }

    if (tdata && tdata.emails?.length > 0) {
      response = {
        ...response,
        messages: tdata.emails
          .filter((data) => !data.is_draft)
          .map((data) => ({
            from: data.from.name || emailToName(data.from.address),
            text: cleanEmailBody(data.content_html),
            to: data.to.map((d) => d.name || emailToName(d.address)).join(', '),
            date: data.date,
          })),
        subject: tdata.emails[0].subject,
      }
    }
    setDomInfo(response)
  }, 100)
}

const gmail = new GmailFactory.Gmail(jQuery)

window._gmailjs = gmail

gmail.observe.on('load', () => {
  gmail.observe.on('view_email', handleDomEmail)

  gmail.observe.on('compose', () => {
    handleDomEmail()
  })

  // Check on load if there is an email present
  handleDomEmail()
})

function setDomInfo(info) {
  var container = document.getElementById('gptmail-info')
  if (!container) {
    container = document.createElement('div')
    container.setAttribute('id', 'gptmail-info')
    document.body.appendChild(container)
  }

  try {
    container.innerText = JSON.stringify(info)
  } catch (error) {
    console.error("[GPTMail] Couldn't retrieve mail info")
  }
}
