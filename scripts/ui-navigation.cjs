// Legacy test names use the real unified settings page and layout disclosure.
function uiTab(page,name){
 const tools={'战术':'战术板','名片':'球迷名片','布局':'主场设置','外观':'主场设置','设置':'主场设置'};
 const go=async(method='click')=>{if(tools[name]){await page.getByRole('tab',{name:'更多',exact:true})[method]();await page.getByRole('button',{name:'打开'+tools[name],exact:true})[method]();if(name==='布局')await page.locator('.bh-settings-layout>summary')[method]();}else await page.getByRole('tab',{name,exact:true})[method]();};
 return {click:()=>go(),tap:()=>go('tap')};
}
async function openAnnotationTool(page){await page.getByRole('button',{name:'编排传球与跑位',exact:true}).click();await page.locator('.bh-free-annotation>summary').click();await page.getByRole('button',{name:'画传球线',exact:true}).click();}
module.exports={uiTab,openAnnotationTool};
