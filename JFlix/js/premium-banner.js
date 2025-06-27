document.addEventListener('DOMContentLoaded', () => {
  const paymentBtn = document.getElementById('payment-btn');
  const paymentModal = document.getElementById('payment-modal');
  const closeModalBtn = document.querySelector('.payment-modal-close');

  if (paymentBtn && paymentModal && closeModalBtn) {
    // Show the modal
    paymentBtn.addEventListener('click', () => {
      paymentModal.style.display = 'block';
    });

    // Hide the modal
    closeModalBtn.addEventListener('click', () => {
      paymentModal.style.display = 'none';
    });

    // Hide the modal when clicking outside of it
    window.addEventListener('click', (event) => {
      if (event.target == paymentModal) {
        paymentModal.style.display = 'none';
      }
    });
  }
});
