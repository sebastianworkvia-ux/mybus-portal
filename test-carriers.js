// Test endpoint - sprawdź czy backend odpowiada
fetch('/api/carriers')
  .then(res => res.json())
  .then(data => console.log('Carriers:', data.length, 'firms'))
  .catch(err => console.error('Error:', err))
