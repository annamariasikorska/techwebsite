/* eslint-disable @typescript-eslint/ban-ts-comment */
const wcID = (selector: string) => document.getElementById(selector);
const wcU = encodeURIComponent(window.location.href);

const newRequest = function (render = true) {
  // Run the API request because there is no cached result available
  fetch('https://api.websitecarbon.com/b?url=' + wcU)
    .then(r => {
      if (!r.ok) {
        // @ts-ignore
        throw Error(r);
      }
      return r.json();
    })

    .then(r => {
      if (render) {
        renderResult(r);
      }

      // Save the result into localStorage with a timestamp
      r.t = new Date().getTime();
      localStorage.setItem('wcb_' + wcU, JSON.stringify(r));
    })

    // Handle error responses
    .catch(e => {
      const element = wcID('wcb_g');
      if (element) {
        element.innerHTML =
          '<a id="wcb_a" target="_blank" rel="noopener" href="https://websitecarbon.com">No Result</a>';
      }
      console.log(e);
      localStorage.removeItem('wcb_' + wcU);
    });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderResult = function (r: any) {
  const wcbg = wcID('wcb_g');
  const wcb2 = wcID('wcb_2');
  if (wcbg) {
    wcbg.innerHTML = `
      <a id="wcb_a" target="_blank" rel="noopener" href="https://websitecarbon.com">${r.c} g of CO<sub>2</sub>/view</a>
    `;
  }

  if (wcb2) {
    wcb2.insertAdjacentHTML('beforeend', 'Cleaner than ' + r.p + '% of pages tested');
  }
};

const init = () => {
  // Get the CSS and add it to the DOM. The placeholder will be filled by gulp build
  // const wcB = wcID('wcb');

  if ('fetch' in window) {
    // If the fetch API is not available, don't do anything.
    // if (wcB) {
    //   // Add the badge markup
    //   wcB.insertAdjacentHTML(
    //     'beforeend',
    //     '<div id="wcb_p"><span id="wcb_g">Measuring CO<sub>2</sub>&hellip;</span><a id="wcb_a" target="_blank" rel="noopener" href="https://websitecarbon.com">Website Carbon</a></div><span id="wcb_2">&nbsp;</span>',
    //   );
    // }

    // Get result if it's saved
    const cachedResponse = localStorage.getItem('wcb_' + wcU);
    const t = new Date().getTime();

    // If there is a cached response, use it
    if (cachedResponse) {
      const r = JSON.parse(cachedResponse);
      renderResult(r);

      // If time since response was cached is over a day, then make a new request and update the cached result in the background
      if (t - r.t > 86400000) {
        newRequest(false);
      }

      // If no cached response, then fetch from API
    } else {
      newRequest();
    }
  }
};

export default init;
