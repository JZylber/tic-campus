export const fetchHTMLData = async (url: string) => {
  const response = await fetch(url);
  const html = await response.text();
  return html;
};

export const prepareCrumbs = () => {
  let leftovers = document.querySelectorAll(
    "#leftoverinformation a.breadcrumb"
  ) as NodeListOf<HTMLAnchorElement>;
  let crumbs = [
    { text: "prueba1", link: "" },
    { text: "prueba1", link: "" },
  ] as Array<{ text: string; link: string }>;
  let menu = [] as Array<string>;
  if (leftovers.length > 0) {
    leftovers.forEach((el) => {
      crumbs.push({ text: el.innerText, link: el.href });
    });
  }
  let menuLeftoverLinks = document.querySelectorAll(
    "#leftoverinformation ul a"
  ) as NodeListOf<HTMLAnchorElement>;
  if (menuLeftoverLinks.length > 0) {
    menuLeftoverLinks.forEach((el) => {
      // Replace i tags with span tags with class material-symbols-outlined
      let iTags = el.querySelectorAll("i");
      iTags.forEach((i) => {
        let span = document.createElement("span");
        span.classList.add("material-symbols-outlined");
        span.classList.add("text-[16px]");
        span.innerText = i.innerText;
        i.replaceWith(span);
      });
      menu.push(el.outerHTML);
    });
  }
  return { crumbs, menu };
};
