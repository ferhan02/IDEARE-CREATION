<?php
$pageTitle = "IdeaRE | Contact";
include __DIR__ . "/../includes/header.php";
?>

<main class="section">
    <div class="container narrow">
        <p class="eyebrow">Contact</p>
        <h1>Tell us about your project</h1>

        <form class="contact-form" method="post" action="">
            <label>
                Name
                <input type="text" name="name" required>
            </label>

            <label>
                Email
                <input type="email" name="email" required>
            </label>

            <label>
                Phone
                <input type="text" name="phone">
            </label>

            <label>
                Message
                <textarea name="message" rows="6" required></textarea>
            </label>

            <button class="btn btn-primary" type="submit">Send Enquiry</button>
        </form>

        <p class="form-note">
            This form is visual only for now. Connect it to MySQL in a later step.
        </p>
    </div>
</main>

<?php include __DIR__ . "/../includes/footer.php"; ?>
