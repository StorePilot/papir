## papir.js

Model Rest API Controller

### Example with WooCommerce & vuejs

`@notice - Cors must be accepted for the given url if running in browser`

#### Fetch client_key & client_secret
```js
import { Woo } from 'papir'
let woo = new Woo(
  'http://example.com',
  'AppName'
)
woo.authenticate() // Opens new window & respond with keys in console if accepted
```

#### Setup for vue
```js
// In main.js
import { papir, Woo } from 'papir'
let woo = new Woo(
  'http://example.com',
  'AppName',
  'ck_***',
  'cs_***'
)
woo.authorize()
Vue.use(papir, { controller: woo.controller })
```

#### Using the module with vue components
```js

// Single instance
let ep = new Endpoint(
  '/wp-json/wc/v2/products{/id}{/batch}',
  this.$glob.woo.controller
)

ep.id = new Prop(ep, 'id')
ep.id.value = 344 // Get product with id 344
ep.fetch().then(() => {
  console.log(ep)
  console.log(ep.raw.data) // Get raw response data
  console.log(ep.name.value)
  console.log(ep.regular_price.value)
  // etc..
  ep.name.value = 'xxx'
  ep.name.save() // Save property
  ep.name.fetch() // Refetch property
  ep.save() // Save all properties
  ep.fetch() // Fetch all properties
  ep.delete()
  ep.loading // Check if model is loading
  ep.clone() // Clone model
})

// Multiple instances
let list = new List(ep)
list
  .query()
  .limit(100)
  .fetch()
  .then(() => {
    console.log('Raw data', list)
    console.log('Raw data', list.raw.data)
    console.log('Children', list.children)
    list.children[0].name.value = 'New name'
    list.children[0].name.save()
    list.save() // Save everything
    list.delete() // Delete all children
    list.fetch() // Delete everything
    list
      .query() // Query by multiple custom key value pairs
      .custom('key', 'value')
      .custom('search', 'term')
      .custom('perPage', '31')
      .limit(42) // Built in filters
      .search()
      .page()
      .offset()
      .order()
      .context('view') // or 'edit'
      .fetch() // fetch ends the query and returns a Promise
    list.loading()
  })

```
