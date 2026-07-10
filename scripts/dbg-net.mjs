const reg = await fetch('http://localhost:5000/api/v1/auth/register', {
  method: 'POST', headers: {'Content-Type':'application/json'},
  body: JSON.stringify({email:'dn-'+Date.now()+'@x.com',password:'Test123456',company:'c',companyShortName:'c',contactName:'c',phone:'13800000000',accessType:1})
}).then(r => r.json())
const r = await fetch('http://localhost:5000/api/v1/console/network/list', { headers: {Authorization: 'Bearer ' + reg.data.token} }).then(r => r.json())
console.log('networks:', JSON.stringify(r.data?.list?.map(n => ({id: n.id, code: n.network_code, name: n.network_name, preset: n.is_preset})), null, 2))
