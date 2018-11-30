-- apply the tigger to the log table  -*- mode: sql -*-

SELECT create_or_replace_trigger('log', 'log_actions', 'log_trigger');

-- end

