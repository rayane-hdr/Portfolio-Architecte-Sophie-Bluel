let works = [];
let categories = [];

const gallery = document.querySelector('.gallery');
const portfolio = document.getElementById('portfolio');

async function getWorks() {
    const response = await fetch('http://localhost:5678/api/works');
    works = await response.json();
    return works;
}

async function getCategories() {
    const response = await fetch('http://localhost:5678/api/categories');
    categories = await response.json();
    return categories;
}

function displayWorks(worksToDisplay) {
    gallery.innerHTML = '';
    worksToDisplay.forEach(work => {
        const figure = document.createElement('figure');
        const img = document.createElement('img');
        const figcaption = document.createElement('figcaption');

        img.src = work.imageUrl;
        img.alt = work.title;
        figcaption.innerText = work.title;

        figure.appendChild(img);
        figure.appendChild(figcaption);
        gallery.appendChild(figure);
    });
}

async function init() {
    await getWorks();
    await getCategories();
    const token = localStorage.getItem('token');

    if (token) {
        setupAdminMode();
    }

    const filters = document.createElement('div');
    filters.className = 'filters';
    
    const allBtn = document.createElement('button');
    allBtn.innerText = 'Tous';
    allBtn.classList.add('active');
    allBtn.addEventListener('click', () => {
        document.querySelectorAll('.filters button').forEach(btn => btn.classList.remove('active'));
        allBtn.classList.add('active');
        displayWorks(works);
    });
    filters.appendChild(allBtn);

    categories.forEach(category => {
        const btn = document.createElement('button');
        btn.innerText = category.name;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filters button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filteredWorks = works.filter(work => work.categoryId === category.id);
            displayWorks(filteredWorks);
        });
        filters.appendChild(btn);
    });

    if (!token) {
        portfolio.insertBefore(filters, gallery);
    }

    displayWorks(works);
    setupModal();
}

function setupAdminMode() {
    const editBar = document.createElement('div');
    editBar.className = 'edit-bar';
    editBar.innerHTML = '<i class="fa-regular fa-pen-to-square"></i> Mode édition';
    document.body.prepend(editBar);
    document.body.style.paddingTop = "59px";

    const loginLink = document.getElementById('login-link');
    loginLink.innerText = 'logout';
    loginLink.href = '#';
    loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        window.location.reload();
    });

    const modifyBtn = document.createElement('a');
    modifyBtn.className = 'modify-btn';
    modifyBtn.href = '#';
    modifyBtn.innerHTML = '<i class="fa-regular fa-pen-to-square"></i> modifier';
    document.querySelector('#portfolio h2').appendChild(modifyBtn);
    
    modifyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    });
}

// LOGIQUE MODALE
function setupModal() {
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.js-modal-close');
    const addPhotoBtn = document.getElementById('add-photo-btn');
    const backBtn = document.getElementById('modal-back-btn');
    
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    addPhotoBtn.addEventListener('click', () => {
        document.getElementById('modal-gallery-view').style.display = 'none';
        document.getElementById('modal-add-photo-view').style.display = 'block';
    });

    backBtn.addEventListener('click', () => {
        document.getElementById('modal-add-photo-view').style.display = 'none';
        document.getElementById('modal-gallery-view').style.display = 'block';
    });

    // Remplir les catégories dans le select
    const select = document.getElementById('photo-category');
    select.innerHTML = '<option value=""></option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.innerText = cat.name;
        select.appendChild(option);
    });

    // Gestion de l'upload et preview
    const fileInput = document.getElementById('file-upload');
    const previewImg = document.getElementById('preview-image');
    const uploadContent = document.querySelectorAll('.upload-area > i, .upload-area > label, .upload-area > p');

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                previewImg.style.display = 'block';
                uploadContent.forEach(el => el.style.display = 'none');
                checkFormValidity();
            };
            reader.readAsDataURL(file);
        }
    });

    // Validation du formulaire
    const form = document.getElementById('add-photo-form');
    const titleInput = document.getElementById('photo-title');
    const categorySelect = document.getElementById('photo-category');
    const submitBtn = document.getElementById('submit-photo');

    const checkFormValidity = () => {
        if (titleInput.value && categorySelect.value && fileInput.files[0]) {
            submitBtn.disabled = false;
        } else {
            submitBtn.disabled = true;
        }
    };

    titleInput.addEventListener('input', checkFormValidity);
    categorySelect.addEventListener('change', checkFormValidity);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        formData.append('title', titleInput.value);
        formData.append('category', categorySelect.value);

        const response = await fetch('http://localhost:5678/api/works', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData
        });

        if (response.ok) {
            await getWorks();
            displayWorks(works);
            closeModal();
            // Reset form
            form.reset();
            previewImg.style.display = 'none';
            uploadContent.forEach(el => el.style.display = 'block');
        }
    });
}

function openModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'flex';
    displayModalGallery();
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
    document.getElementById('modal-add-photo-view').style.display = 'none';
    document.getElementById('modal-gallery-view').style.display = 'block';
}

function displayModalGallery() {
    const modalGallery = document.querySelector('.modal-gallery');
    modalGallery.innerHTML = '';
    works.forEach(work => {
        const figure = document.createElement('figure');
        figure.innerHTML = `
            <img src="${work.imageUrl}" alt="${work.title}">
            <span class="delete-icon" onclick="deleteWork(${work.id})"><i class="fa-solid fa-trash-can"></i></span>
        `;
        modalGallery.appendChild(figure);
    });
}

async function deleteWork(id) {
    const response = await fetch(`http://localhost:5678/api/works/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (response.ok) {
        await getWorks();
        displayWorks(works);
        displayModalGallery();
    }
}

init();
