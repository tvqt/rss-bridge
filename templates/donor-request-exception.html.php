<section>
    <div class="advice">
        <p>RSS-Bridge pushed job to retreive data. Please wait until your job will be done.</p>
        <?php
        if ($pendingJobsCount) {
        ?><p>Pending jobs: <?php echo e($pendingJobsCount) ?></p><?php
        }
        ?>
    </div>
</section>
