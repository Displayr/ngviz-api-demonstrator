export function createElement(element_name: string, attrs: {[name:string]: string}, inner_html: string): HTMLElement {
	const e = document.createElement(element_name);
	for (const k in attrs)
		e.setAttribute(k, attrs[k]);
	e.innerHTML = inner_html;
	return e;
}