import {test,expect,type APIRequestContext,type Page} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const origin='http://127.0.0.1:5173';
async function login(api:APIRequestContext,persona:string){const r=await api.post('/api/session',{headers:{Origin:origin},data:{persona}});expect(r.ok(),await r.text()).toBeTruthy();}
async function act(api:APIRequestContext,action:string,data:Record<string,unknown>){const r=await api.post('/api/portal',{headers:{Origin:origin},data:{action,data}});expect(r.ok(),await r.text()).toBeTruthy();return r.json();}
async function loadProductPhotographs(page:Page,expectedCount?:number){
 const cards=page.locator('.sf-product-card');await expect(cards.first()).toBeVisible();
 if(expectedCount!==undefined)await expect(cards).toHaveCount(expectedCount);
 const count=await cards.count();
 for(const card of await cards.all())await card.scrollIntoViewIfNeeded();
 const photographs=cards.locator('img');await expect(photographs).toHaveCount(count);
 await expect.poll(()=>photographs.evaluateAll(images=>images.every(image=>image instanceof HTMLImageElement&&image.complete&&image.naturalWidth>0))).toBe(true);
 await page.evaluate(()=>window.scrollTo(0,0));
}

test('customer registers, browses, checks out and tracks only own persistent orders',async({page,context})=>{
 await login(context.request,'administrator');await act(context.request,'admin.reset',{confirmation:'RESET SYNTHETIC DEMONSTRATION'});
 await context.request.post('/api/session',{headers:{Origin:origin},data:{action:'logout'}});
 await page.goto('/');await expect(page.getByRole('heading',{name:'Good seasons start with clear choices.'})).toBeVisible();
 await expect(page.getByRole('link',{name:'Compound fertiliser',exact:true})).toBeVisible();
 const denied=await context.request.get('/api/portal?module=finance');expect(denied.status()).toBe(401);
 const spoofed=await context.request.get('/api/portal?module=hr',{headers:{'oai-authenticated-user-id':'spoof','oai-authenticated-user-email':'fagrodealers@gmail.com'}});expect(spoofed.status()).toBe(401);
 await page.goto('/account');await page.getByRole('button',{name:'Open sample customer account'}).click();
 await expect(page.getByRole('heading',{name:'Create your customer profile'})).toBeVisible();
 await page.getByLabel('Your name',{exact:true}).fill('Sample Customer A');await page.getByLabel('Phone number',{exact:true}).fill('000-DEMO-ONLY');await page.getByLabel('Address',{exact:true}).fill('Demonstration collection address');
 await page.getByRole('checkbox',{name:'I would like product news and offers.'}).check();await page.getByRole('checkbox',{name:'I have read the'}).check();await page.getByRole('button',{name:'Save customer profile'}).click();
 await expect(page.getByRole('heading',{name:'Your orders',exact:true})).toBeVisible();
 await page.goto('/catalogue');await page.getByLabel('Search products').fill('maize');await expect(page.locator('.sf-product-card')).toHaveCount(1);
 await page.getByRole('link',{name:'Maize seed',exact:true}).click();await expect(page.getByRole('heading',{name:'Maize seed',exact:true})).toBeVisible();
 await page.getByLabel('Quantity',{exact:true}).fill('2');await page.getByRole('button',{name:'Add to cart',exact:true}).click();await expect(page.getByRole('status')).toContainText('saved');
 await page.getByRole('link',{name:'Cart, 2 items'}).click();await expect(page).toHaveURL(/\/cart$/);await expect(page.getByRole('heading',{name:'Review your requirements.'})).toBeVisible();
 await page.getByLabel('How would you like to receive your order?').selectOption('delivery-request');await page.getByLabel('Town or area').fill('Lilongwe demonstration area');await page.getByLabel('Delivery address (required for delivery requests)').fill('Sample address for presentation only');await page.getByRole('checkbox',{name:'I understand this is a demonstration request'}).check();
 await page.getByRole('button',{name:'Submit order request'}).click();await expect(page).toHaveURL(/\/account\/orders\/ORD-DEMO-/);
 await expect(page.getByText('Awaiting confirmation',{exact:true}).first()).toBeVisible();const orderUrl=page.url();await page.reload();await expect(page.getByRole('heading',{name:'Order progress'})).toBeVisible();
 await mkdir('aothothe-pack/evidence',{recursive:true});await page.screenshot({path:'aothothe-pack/evidence/customer-order-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'Download demonstration summary'}).click();
 await page.goto('/catalogue');await page.getByRole('link',{name:'Knapsack sprayer',exact:true}).click();
 await expect(page).toHaveURL(/\/products\/demo-sprayer$/);await expect(page.getByRole('heading',{name:'Knapsack sprayer',level:1,exact:true})).toBeVisible();
 await page.goBack();await expect(page).toHaveURL(/\/catalogue$/);await expect(page.getByRole('heading',{name:'Find your farm essentials.',level:1,exact:true})).toBeVisible();
 await page.goForward();await expect(page).toHaveURL(/\/products\/demo-sprayer$/);await expect(page.getByRole('heading',{name:'Knapsack sprayer',level:1,exact:true})).toBeVisible();
 await login(context.request,'customer-b');await page.goto(orderUrl);await expect(page.getByRole('heading',{name:'Create your customer profile'})).toBeVisible();
 await act(context.request,'customer.register',{name:'Sample Customer B',phone:'000-DEMO-B',marketingConsent:false});await page.reload();await expect(page.getByRole('heading',{name:'Order not available.'})).toBeVisible();
 await page.goto('/hq/finance');await expect(page).toHaveURL(/\/account$/);expect((await context.request.get('/api/portal?module=finance')).status()).toBe(403);
});

test('public direct routes, responsive layouts, source credits and image fallback',async({page})=>{
 for(const path of ['/catalogue','/about','/news','/news/planning-your-inputs','/contact','/careers','/reviews','/privacy','/terms','/image-credits']){const r=await page.goto(path);expect(r?.status()).toBe(200);await expect(page.locator('h1')).toBeVisible();}
 await page.goto('/catalogue');await page.route('**/images/products/maize.jpg',r=>r.abort());await page.goto('/products/demo-maize');await expect(page.getByText('Product photograph pending')).toBeVisible();await page.unroute('**/images/products/maize.jpg');
 await page.goto('/catalogue');await loadProductPhotographs(page,6);
 for(const viewport of [{width:1440,height:1000},{width:834,height:1112},{width:390,height:844}]){await page.setViewportSize(viewport);await page.goto('/');await expect(page.getByRole('link',{name:'Compound fertiliser',exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBe(true);await loadProductPhotographs(page);await page.screenshot({path:`aothothe-pack/evidence/public-${viewport.width}.png`,fullPage:true});}
 await page.getByRole('button',{name:'Toggle navigation'}).click();await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Products',exact:true}).click();await expect(page).toHaveURL(/\/catalogue$/);await page.reload();await expect(page.getByRole('heading',{name:'Find your farm essentials.'})).toBeVisible();
 await page.goto('/rehearsal');await expect(page.getByRole('heading',{name:'Local presentation rehearsal'})).toBeVisible();
});
