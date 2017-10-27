from django.db import models
from django.utils.translation import ugettext_lazy as _
from django.contrib.sites.models import Site
from model_utils.models import TimeStampedModel

from config_models.models import ConfigurationModel


class Schedule(TimeStampedModel):
    enrollment = models.OneToOneField('student.CourseEnrollment', null=False)
    active = models.BooleanField(
        default=True,
        help_text=_('Indicates if this schedule is actively used')
    )
    start = models.DateTimeField(
        db_index=True,
        help_text=_('Date this schedule went into effect')
    )
    upgrade_deadline = models.DateTimeField(
        blank=True,
        db_index=True,
        null=True,
        help_text=_('Deadline by which the learner must upgrade to a verified seat')
    )

    def get_experience_type(self):
        try:
            return self.experience.experience_type
        except ScheduleExperience.DoesNotExist:
            return ScheduleExperience.DEFAULT

    class Meta(object):
        verbose_name = _('Schedule')
        verbose_name_plural = _('Schedules')


class ScheduleConfig(ConfigurationModel):
    KEY_FIELDS = ('site',)

    site = models.ForeignKey(Site)
    create_schedules = models.BooleanField(default=False)
    enqueue_recurring_nudge = models.BooleanField(default=False)
    deliver_recurring_nudge = models.BooleanField(default=False)
    enqueue_upgrade_reminder = models.BooleanField(default=False)
    deliver_upgrade_reminder = models.BooleanField(default=False)
    enqueue_course_update = models.BooleanField(default=False)
    deliver_course_update = models.BooleanField(default=False)


class ScheduleExperience(models.Model):
    DEFAULT = 0
    COURSE_UPDATES = 1
    EXPERIENCES = (
        (DEFAULT, 'Recurring Nudge and Upgrade Reminder'),
        (COURSE_UPDATES, 'Course Updates')
    )

    schedule = models.OneToOneField(Schedule, related_name='experience')
    experience_type = models.PositiveSmallIntegerField(choices=EXPERIENCES, default=DEFAULT)