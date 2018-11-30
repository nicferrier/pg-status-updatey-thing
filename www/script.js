window.addEventListener("load", async loadEvt => {
    //const es = new EventSource("/ric/stream");
    const [fetchError, fetchResult]
          = await fetch("/ric/top").then(v => [undefined, v]).catch(e => [e]);
    if (fetchError !== undefined) {
        console.log("can't reach the server");
    }
    else {
        const [jsonError, data]
              = await fetchResult.json().then(v => [undefined, v]).catch(e => [e]);
        if (jsonError !== undefined) {
            console.log("some error with the response?", fetchResult);
        }
        else {
            const section = document.querySelector("section");
            const template = document.querySelector("template#status");
            data.forEach(({
                id, data: {
                    user,
                    status:updateText,
                    timestamp
                }
            }) => {
                const article = document.importNode(template.content, true);
                article.firstElementChild.setAttribute("id", id);
                const abbr = article.querySelector("abbr.user");
                abbr.setAttribute("title", user);
                abbr.textContent = user;
                const dateTime = new Date(timestamp);
                const time = article.querySelector("time");
                time.setAttribute("datetime", dateTime);
                time.textContent = dateTime.toISOString();
                const p = article.querySelector("p");
                p.textContent = updateText;
                section.appendChild(article);
            });
        }
    }
});
