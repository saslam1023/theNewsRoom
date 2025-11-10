let newsletters = [];
let currentIndex = 0;

  // Load the JSON list of archived files
async function loadArchiveList(){
  try {
    const res = await fetch('newsletters.json');
    newsletters = await res.json();
    const select = document.getElementById('archiveSelect');
    newsletters.forEach((n,i)=>{
    const opt = document.createElement('option');
    opt.value = i;       // index
    opt.textContent = n.title;
    select.appendChild(opt);
  });
  } catch(err){
    console.error('Error loading archive list:', err);
  }
}

// Load selected newsletter into the editor container
async function loadArchivedEdition(index){
  if(index === "") return;
  currentIndex = parseInt(index);
  displayNewsletter(currentIndex);
}


// Call this on page load
window.addEventListener('DOMContentLoaded', loadArchiveList);



async function displayNewsletter(index){
  if(index < 0 || index >= newsletters.length) return;
  currentIndex = index;

  const res = await fetch(newsletters[index].filename);
  const html = await res.text();
  document.getElementById('previewContainer').innerHTML = html;
  document.getElementById('version').textContent = newsletters[index].title;
}


document.getElementById('nextBtn').addEventListener('click',()=>displayNewsletter(currentIndex+1));
document.getElementById('prevBtn').addEventListener('click',()=>displayNewsletter(currentIndex-1));